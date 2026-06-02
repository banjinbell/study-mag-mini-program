// Qwen 3-VL-Plus — 阿里当前推荐视觉模型
// 高精度物体识别、3D 定位、文档/网页解析
// 原生 DashScope 多模态端点（非 OpenAI 兼容）
module.exports = {
  name: 'Qwen 3-VL-Plus',
  model: 'qwen3-vl-plus',
  vendor: 'alibaba',

  async describe(imageBase64, prompt) {
    return callQwen([{ image: `data:image/jpeg;base64,${imageBase64}` }], prompt)
  },

  async describeFromUrls(imageUrls, prompt) {
    const userText = prompt || '这是一组小红书图集，请按顺序完整提取所有图片中的文字内容（包括标题、正文、引用、标签），保持原有结构。如果是连续的图文笔记，识别出贯穿全篇的主题和关键观点，最后用一两句话总结整体内容。'
    const imageBlocks = imageUrls.map(url => ({ image: url }))
    return callQwen(imageBlocks, userText)
  }
}

async function callQwen(imageBlocks, prompt) {
  const userText = prompt || '请完整提取图片中的所有文字内容，保持原有段落结构。标题、正文、引用、标签分别保留。如果是小红书/公众号截图，识别出帖子主题和关键观点。'

  const resp = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3-vl-plus',
        input: {
          messages: [{
            role: 'user',
            content: [...imageBlocks, { text: userText }]
          }]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 4000
        }
      })
    }
  )
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Qwen 3-VL-Plus error: ${resp.status} ${err}`)
  }
  const json = await resp.json()
  const content = json.output.choices[0].message.content
  if (Array.isArray(content)) return content.map(c => c.text || '').join('')
  return content
}
