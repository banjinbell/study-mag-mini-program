// 智谱 GLM-4.6V — 视觉理解 + reasoning，128K 上下文
module.exports = {
  name: 'GLM-4.6V',
  model: 'glm-4.6v',
  vendor: 'zhipu',

  async describe(imageBase64, prompt) {
    const userText = prompt || '请完整提取图片中的所有文字内容，保持原有段落结构。标题、正文、引用、标签分别保留。如果是小红书/公众号截图，识别出帖子主题和关键观点。'

    const resp = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4.6v',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: 'text', text: userText }
            ]
          }],
          max_tokens: 3000,
          temperature: 0.3
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`GLM-4.6V error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    return json.choices[0].message.content
  }
}
