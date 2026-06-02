// DeepSeek V4 Pro — 旗舰模型，用于批判视角等深度推理步骤
// 2026-05 75% 促销价：输入 cache miss $0.435/M，输出 $0.87/M
module.exports = {
  name: 'DeepSeek V4 Pro',
  model: 'deepseek-v4-pro',
  vendor: 'deepseek',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
        ],
        max_tokens: options.max_tokens || 4000,
        temperature: options.temperature ?? 0.7,
        // V4 Pro 默认开启思考；如需关闭显式传 false
        enable_thinking: options.thinking !== false,
        thinking_budget: options.thinking_budget || 4000,
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`DeepSeek V4 Pro error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
