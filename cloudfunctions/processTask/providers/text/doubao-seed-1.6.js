// Doubao Seed 1.6 — 火山方舟主力文本模型，256K 上下文
// 端点：方舟原生（兼容 OpenAI 格式，但也能填模型名而非 endpoint id）
module.exports = {
  name: 'Doubao Seed 1.6',
  model: 'doubao-seed-1-6-251015',
  vendor: 'volcengine',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const resp = await fetch(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ARK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // 2026 新策略：可直接填模型名，无需先在控制台创建 endpoint
          model: process.env.ARK_TEXT_MODEL || 'doubao-seed-1-6-251015',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
          ],
          max_tokens: options.max_tokens || 4000,
          temperature: options.temperature ?? 0.7,
          // 思考模式：Seed 1.6 默认关闭；显式开启
          thinking: options.thinking ? { type: 'enabled' } : undefined,
          response_format: { type: 'json_object' }
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Doubao Seed 1.6 error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
