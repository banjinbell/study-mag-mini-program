// Doubao Seed 1.6 Vision — 火山方舟视觉模型
// 支持图像 + 视频 + GUI Agent + Grounding
// 走方舟 OpenAI 兼容端点（多模态消息格式）
module.exports = {
  name: 'Doubao Seed 1.6 Vision',
  model: 'doubao-seed-1-6-vision-251015',
  vendor: 'volcengine',

  async describe(imageBase64, prompt) {
    const userText = prompt || '请完整提取图片中的所有文字内容，保持原有段落结构。标题、正文、引用、标签分别保留。如果是小红书/公众号截图，识别出帖子主题和关键观点。'

    const resp = await fetch(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ARK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.ARK_VISION_MODEL || 'doubao-seed-1-6-vision-251015',
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
      throw new Error(`Doubao Vision error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    return json.choices[0].message.content
  }
}
