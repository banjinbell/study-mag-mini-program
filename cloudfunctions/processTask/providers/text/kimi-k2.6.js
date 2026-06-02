// Moonshot Kimi K2.6 — 256K 上下文，OpenAI 完全兼容
// 长公众号文章可以一次塞下
module.exports = {
  name: 'Kimi K2.6',
  model: 'kimi-k2.6',
  vendor: 'moonshot',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    // Kimi 不允许空 system message，systemPrompt 为空时跳过
    const messages = []
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({
      role: 'user',
      content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2)
    })

    const resp = await fetch(
      'https://api.moonshot.cn/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'kimi-k2.6',
          messages,
          // ⚠️ K2.6 是思考模型，思考链先消耗 token，至少给 4000 才有空间输出 content
          max_tokens: Math.max(options.max_tokens || 4000, 4000),
          // ⚠️ K2.6 是思考模型，强制要求 temperature=1
          temperature: 1,
          response_format: { type: 'json_object' }
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Kimi K2.6 error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
