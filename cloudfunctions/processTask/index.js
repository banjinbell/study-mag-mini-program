const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const visionProviders = require('./providers/vision')
const ttsProviders = require('./providers/tts')
const xhs = require('./providers/xhs')
const wechat = require('./providers/wechat')
const { runSkill } = require('./skills/loader')

function detectLinkSource(url) {
  if (/mp\.weixin\.qq\.com/.test(url)) return 'wechat'
  if (/xiaohongshu\.com|xhslink\.com/.test(url)) return 'xhs'
  return null
}

exports.main = async ({ taskId }) => {
  const taskRef = db.collection('tasks').where({ taskId })

  try {
    const { data: tasks } = await taskRef.get()
    const task = tasks[0]
    if (!task) throw new Error(`task not found: ${taskId}`)

    await taskRef.update({ data: { status: 'processing' } })

    const visionProviderKey = process.env.VISION_PROVIDER || 'qwen3-vl-plus'
    const visionProvider = visionProviders[visionProviderKey]
    if (!visionProvider) throw new Error(`Unknown vision provider: ${visionProviderKey}`)

    // 1. 种子内容
    let seedContent = task.extractedText || task.inputText || ''

    if (!seedContent && (task.inputType === 'xhs_link' || task.inputType === 'link') && task.inputUrl) {
      const source = detectLinkSource(task.inputUrl)
      if (source === 'wechat') {
        const article = await wechat.fetchArticle(task.inputUrl)
        console.log('[processTask] wechat fetched: title=%s, author=%s, textLen=%s, imgs=%s',
          article.title, article.author, article.text.length, article.images.length)
        seedContent = `【标题】${article.title}\n【作者】${article.author}\n\n${article.text}`
        const fileIDs = article.images.length ? await wechat.uploadImages(article.images, taskId) : []
        await taskRef.update({
          data: {
            extractedText: seedContent,
            sourceTitle: article.title,
            sourceAuthor: article.author,
            sourceUrl: article.sourceUrl,
            imageFileIDs: fileIDs,
            imageCount: fileIDs.length
          }
        })
      } else if (source === 'xhs') {
        const imageUrls = await xhs.fetchImageUrls(task.inputUrl)
        const fileIDs = await xhs.downloadAndUpload(imageUrls, taskId)
        const httpsUrls = await xhs.fileIDsToHttpsUrls(fileIDs)
        if (!visionProvider.describeFromUrls) {
          throw new Error(`Vision provider ${visionProviderKey} 不支持多图 URL 输入`)
        }
        seedContent = await visionProvider.describeFromUrls(httpsUrls)
        await taskRef.update({
          data: { extractedText: seedContent, imageFileIDs: fileIDs, imageCount: fileIDs.length }
        })
      } else {
        throw new Error(`暂不支持该链接来源：${task.inputUrl}`)
      }
    } else if (!seedContent && task.inputType === 'image' && task.inputFileID) {
      const file = await cloud.downloadFile({ fileID: task.inputFileID })
      seedContent = await visionProvider.describe(file.fileContent.toString('base64'))
      await taskRef.update({ data: { extractedText: seedContent } })
    }

    const selectedConcepts = task.selectedConcepts || []
    const conceptsContext = selectedConcepts.length > 0
      ? `\n\n【用户选定的重点概念（需重点展开，占主要篇幅）】：${selectedConcepts.join('、')}`
      : ''

    // 读用户档案（如果填了），拼成 readerContext 注入到下游所有 skill
    let readerContext = ''
    try {
      const { data: profiles } = await db.collection('userProfiles')
        .where({ _openid: task._openid }).get()
      const p = profiles[0]
      if (p && (p.identity || p.level || (p.tones && p.tones.length) || (p.topics && p.topics.length))) {
        const densityMap = {
          new: '轻量（多举例 · 多铺垫 · 多类比 · 适合放松听）',
          mid: '常规（铺垫与结论平衡）',
          expert: '密集（直接给结论 · 术语保留 · 节奏快 · 适合通勤快听）'
        }
        const densityShort = { new: '轻', mid: '中', expert: '密' }
        const lines = ['\n\n【读者档案 · READER DOSSIER】']
        if (p.identity) lines.push(`身份：${p.identity}`)
        if (p.level) lines.push(`信息密度偏好：${densityMap[p.level] || p.level}`)
        if (p.tones && p.tones.length) lines.push(`对谈偏好：${p.tones.join(' + ')}`)
        if (p.topics && p.topics.length) lines.push(`长期关注：${p.topics.join(' · ')}`)
        lines.push('请在生成内容时：')
        lines.push(`- 举例时优先用这个读者熟悉的场景`)
        if (p.level) lines.push(`- 按「${densityShort[p.level] || '中'}」密度把握节奏（不是讲解深度，而是信息浓度）`)
        if (p.tones && p.tones.length) lines.push(`- 主持人语气贴合「${p.tones.join('、')}」的风格`)
        if (p.topics && p.topics.length) lines.push(`- 适当联系 ${p.topics.slice(0, 3).join('、')} 等已有知识`)
        readerContext = lines.join('\n')
        console.log('[processTask] reader context injected')
      }
    } catch (e) {
      console.warn('[processTask] read profile failed:', e.message || e)
    }

    // 2. 确认概念
    const concepts = await runSkill('01-extract-concepts', {
      seedContent,
      conceptsContext,
      selectedConcepts
    })

    // 3. 并行三路补充（注入 readerContext 给联系拓展的 02/03）
    const [background, related, critical] = await Promise.all([
      runSkill('02-add-background', { seedContent, concepts, conceptsContext, readerContext }),
      runSkill('03-expand-related', { seedContent, concepts, conceptsContext, readerContext }),
      // 批判视角默认走推理模型；若没有则回退到 skill 文件的 preferred_model
      runSkill('04-critical-perspective', { seedContent, concepts, conceptsContext },
        process.env.REASONING_TEXT_PROVIDER || 'deepseek-v4-pro')
    ])

    // 4. 综合学习资料（注入 readerContext）
    const article = await runSkill('05-synthesize-article', {
      seedContent, background, related, critical, selectedConcepts, readerContext
    })

    // 5. 改写对话稿（注入 readerContext）
    const dialogueResult = await runSkill('06-write-dialogue', { article, selectedConcepts, readerContext })
    const dialogue = dialogueResult.dialogue || dialogueResult

    // 6. TTS 合成
    const ttsProviderKey = process.env.TTS_PROVIDER || 'doubao-podcast'
    const ttsProvider = ttsProviders[ttsProviderKey]
    if (!ttsProvider) throw new Error(`Unknown TTS provider: ${ttsProviderKey}`)
    const mp3Buffer = await ttsProvider.synthesizeDialogue(dialogue)

    // 7. 上传音频
    const audioUpload = await cloud.uploadFile({
      cloudPath: `audio/${taskId}.mp3`,
      fileContent: mp3Buffer
    })

    // 8. 标记完成
    await taskRef.update({
      data: {
        status: 'done',
        title: article.title,
        summary: article.summary,
        keyPoints: article.keyPoints,
        sections: article.sections,
        focusConcepts: dialogueResult.focusConcepts || selectedConcepts,
        hostA: dialogueResult.hostA || '小诺',
        hostB: dialogueResult.hostB || '阿明',
        dialogue,
        audioFileID: audioUpload.fileID,
        estimatedMinutes: dialogueResult.estimatedMinutes || 3,
        providers: {
          vision: process.env.VISION_PROVIDER || 'qwen3-vl-plus',
          text: process.env.TEXT_PROVIDER || 'deepseek-v4-flash',
          textReasoning: process.env.REASONING_TEXT_PROVIDER || 'deepseek-v4-pro',
          tts: ttsProviderKey
        },
        finishedAt: db.serverDate()
      }
    })

    // 9. 订阅消息（可选）
    if (task._openid && process.env.TMPL_ID) {
      await cloud.openapi.subscribeMessage.send({
        touser: task._openid,
        templateId: process.env.TMPL_ID,
        page: `pages/player/index?taskId=${taskId}`,
        data: {
          thing1: { value: (article.title || '').slice(0, 20) },
          time2: { value: new Date().toLocaleString('zh-CN') }
        }
      }).catch(e => console.warn('subscribeMessage failed:', e.errMsg))
    }

  } catch (err) {
    console.error('processTask failed:', err)
    await taskRef.update({
      data: { status: 'failed', error: String(err), failedAt: db.serverDate() }
    })
  }
}
