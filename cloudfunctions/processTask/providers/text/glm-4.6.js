// 智谱 GLM-4.6 — 2025-12 发布，hybrid thinking，200K 上下文
// 已废弃 JWT 拼装，直接 Bearer
module.exports = {
  name: 'GLM-4.6',
  model: 'glm-4.6',
  vendor: 'zhipu',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const resp = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4.6',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
          ],
          max_tokens: options.max_tokens || 4000,
          temperature: options.temperature ?? 0.7,
          // 思考模式开关
          thinking: { type: options.thinking ? 'enabled' : 'disabled' },
          response_format: { type: 'json_object' }
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`GLM-4.6 error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
