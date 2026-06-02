// extractConcepts：在用户提交后同步调用（p50 目标 <15s）
// 流程：图片→OCR (Qwen3-VL-Plus 原生)→ 概念抽取 (DeepSeek V4 Flash 原生)
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { taskId } = event

  const { data: tasks } = await db.collection('tasks').where({ taskId }).get()
  const task = tasks[0]
  if (!task) return { error: 'task not found' }

  let seedContent = task.inputText || ''

  // 1. 图片：用阿里 Qwen3-VL-Plus 原生多模态端点做 OCR + 主题理解
  if (task.inputType === 'image' && task.inputFileID && !seedContent) {
    seedContent = await describeImage(task.inputFileID)
    await db.collection('tasks').where({ taskId }).update({
      data: { extractedText: seedContent }
    })
  }

  // 2. 概念抽取：用 DeepSeek V4 Flash（性价比 + 1M ctx）
  const concepts = await extractConcepts(seedContent, task.userIdentity)

  await db.collection('tasks').where({ taskId }).update({
    data: { extractedConcepts: concepts, seedContent }
  })

  return { taskId, concepts }
}

async function describeImage(fileID) {
  const file = await cloud.downloadFile({ fileID })
  const base64 = file.fileContent.toString('base64')

  const resp = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.VISION_MODEL_FAST || 'qwen3-vl-plus',
        input: {
          messages: [{
            role: 'user',
            content: [
              { image: `data:image/jpeg;base64,${base64}` },
              { text: '完整提取图片中的所有文字内容，保持原段落结构。标题、正文、引用、标签分别保留。如果是小红书/公众号截图，附带一句主题概括。' }
            ]
          }]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 3000
        }
      })
    }
  )
  if (!resp.ok) throw new Error(`Vision OCR error: ${resp.status} ${await resp.text()}`)
  const json = await resp.json()
  const content = json.output.choices[0].message.content
  if (Array.isArray(content)) return content.map(c => c.text || '').join('')
  return content
}

async function extractConcepts(content, userIdentity) {
  const identityHint = userIdentity && userIdentity !== 'general'
    ? `\n用户身份：${userIdentity}，请结合其背景视角提取最相关的概念。`
    : ''

  const prompt = `请从以下内容中提取 5-10 个核心概念或知识点，每个概念用 2-6 个字概括，优先选择有深度讨论价值的概念。${identityHint}

内容：
${content.slice(0, 5000)}

只返回 JSON：{"concepts": ["概念1", "概念2", ...]}`

  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.FAST_TEXT_MODEL || 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })
  if (!resp.ok) throw new Error(`DeepSeek error: ${resp.status} ${await resp.text()}`)
  const json = await resp.json()
  const parsed = JSON.parse(json.choices[0].message.content)
  return parsed.concepts || []
}
