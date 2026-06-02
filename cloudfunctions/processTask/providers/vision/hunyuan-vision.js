// 腾讯混元 TurboS Vision —— CloudBase 同机房，延迟最低
// 价格：¥3 输入 / ¥9 输出 per M tokens
module.exports = {
  name: 'Hunyuan TurboS Vision',
  model: 'hunyuan-turbos-vision',
  vendor: 'tencent',

  async describe(imageBase64, prompt) {
    const userText = prompt || '请完整提取图片中的所有文字内容，保持原有段落结构。标题、正文、引用、标签分别保留。如果是小红书/公众号截图，识别出帖子主题和关键观点。'

    const resp = await fetch(
      'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUNYUAN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'hunyuan-turbos-vision',
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
      throw new Error(`Hunyuan Vision error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    return json.choices[0].message.content
  }
}
