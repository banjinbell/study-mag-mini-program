// Qwen 3.7-max — 阿里旗舰文本模型，1M 上下文，hybrid thinking
// 原生 DashScope 端点（非 OpenAI 兼容），支持 enable_thinking + thinking_budget + 搜索增强
module.exports = {
  name: 'Qwen 3.7-Max',
  model: 'qwen3.7-max',
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
          model: 'qwen3.7-max',
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
            // hybrid thinking 控制
            enable_thinking: options.thinking ?? true,
            thinking_budget: options.thinking_budget || 2000,
            // 关闭搜索增强以降低延迟（学伴自己做联网拓展）
            enable_search: false,
            response_format: { type: 'json_object' }
          }
        })
      }
    )
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Qwen 3.7-Max error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    const content = json.output.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
