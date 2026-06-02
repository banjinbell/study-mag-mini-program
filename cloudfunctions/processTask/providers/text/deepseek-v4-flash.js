// DeepSeek V4 Flash — 主力性价比模型
// 原生端点：OpenAI 兼容（DeepSeek 主推协议，自动 prompt caching）
// 也支持 Anthropic Messages 协议（cache 控制更细，本文件暂不用）
// 2026-04 发布；旧 deepseek-chat 2026-07-24 废弃
module.exports = {
  name: 'DeepSeek V4 Flash',
  model: 'deepseek-v4-flash',
  vendor: 'deepseek',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
        ],
        max_tokens: options.max_tokens || 4000,
        temperature: options.temperature ?? 0.7,
        // 思考模式控制（V4 hybrid）：默认非思考；如需思考链显式打开
        ...(options.thinking ? { enable_thinking: true, thinking_budget: options.thinking_budget || 2000 } : {}),
        // JSON mode：prompt 里必须出现 "json" 字样并给示例
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`DeepSeek V4 Flash error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.max_tokens || 800,
        temperature: options.temperature ?? 0.3,
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) throw new Error(`DeepSeek V4 Flash error: ${resp.status}`)
    const json = await resp.json()
    return json.choices[0].message.content
  }
}
