// Qwen Plus（取 latest 稳定版）— 性价比首选
// ⚠️ 之前用 qwen3.6-plus 返回 400 url error；改为 qwen-plus-latest 兼容稳定线
module.exports = {
  name: 'Qwen Plus (latest)',
  model: 'qwen-plus-latest',
  vendor: 'alibaba',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const resp = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable'
        },
        body: JSON.stringify({
          model: 'qwen-plus-latest',
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
            ]
          },
          parameters: {
            result_format: 'message',
            max_tokens: options.max_tokens || 4000,
            temperature: options.temperature ?? 0.7,
            enable_thinking: options.thinking ?? false,
            enable_search: false,
            response_format: { type: 'json_object' }
          }
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Qwen 3.6-Plus error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.output.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
