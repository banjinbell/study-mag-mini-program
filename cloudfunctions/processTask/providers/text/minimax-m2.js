// MiniMax M2 — MoE agentic 模型，200K 上下文
// 国内端点用 api.minimaxi.chat；海外用 api.minimax.io
module.exports = {
  name: 'MiniMax M2',
  model: 'MiniMax-M2',
  vendor: 'minimax',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const base = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.chat'
    const resp = await fetch(`${base}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'MiniMax-M2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
        ],
        max_tokens: options.max_tokens || 4000,
        temperature: options.temperature ?? 0.7,
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`MiniMax M2 error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    // MiniMax 返回 200 也可能在 base_resp 里报错
    if (json.base_resp && json.base_resp.status_code !== 0) {
      throw new Error(`MiniMax M2: ${json.base_resp.status_msg} (code ${json.base_resp.status_code})`)
    }
    if (!json.choices || !json.choices[0]) {
      throw new Error(`MiniMax M2: unexpected response ${JSON.stringify(json).slice(0, 200)}`)
    }
    const content = json.choices[0].message.content
    try { return JSON.parse(content) } catch { return content }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}
