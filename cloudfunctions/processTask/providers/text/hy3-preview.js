// 腾讯混元 Hy3 Preview · 走 CloudBase 内置 AI（小程序成长计划免费 Token）
//
// ⚠ 必须运行在 <your-env-id>（个人版）env 才能用 1 亿赠送 Token
// 在其他 env 调用会扣费或报 EXCEED_TOKEN_QUOTA_LIMIT
//
// 模型 hy3-preview = 混元 v3 295B MoE / 21B active / 256K 上下文
const cloudbase = require('@cloudbase/node-sdk')

// 复用 SYMBOL_CURRENT_ENV，自动绑定云函数所在 env 的资源
const tcb = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
const ai = tcb.ai()

module.exports = {
  name: 'Hy3 Preview · CloudBase',
  model: 'hy3-preview',
  vendor: 'cloudbase-hunyuan-v3',

  async runWithSkill({ systemPrompt, userInput, options = {} }) {
    const model = ai.createModel('hunyuan-v3')

    const messages = [
      { role: 'system', content: systemPrompt + '\n\n请严格返回 JSON 对象，不要包含其他文字。' },
      { role: 'user', content: typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2) }
    ]

    const t0 = Date.now()
    try {
      // ⚠ 用 streamText 而不是 generateText：长输入（>2k tokens）下，
      //    generateText 等待完整响应容易超 SDK 默认 timeout（~30s）；
      //    streamText 持续接收 chunks，理论上无单次响应超时限制。
      const res = await model.streamText({
        model: 'hy3-preview',
        messages
      })
      let content = ''
      for await (const chunk of res.textStream) {
        content += chunk
      }
      // 拉 usage / messages — 流结束后这些 Promise 才 resolve
      let usage = null
      try { usage = await res.usage } catch (e) {}
      console.log('[hy3-preview] ✓ %sms · usage=%j · contentLen=%s',
        Date.now() - t0, usage, content.length)
      return parseJsonLoose(content)
    } catch (err) {
      console.error('[hy3-preview] ✗ %sms · %s', Date.now() - t0, err.message || err)
      throw new Error(`Hy3 Preview (CloudBase) error: ${err.message || err}`)
    }
  },

  async runRaw(prompt, options = {}) {
    return this.runWithSkill({ systemPrompt: '', userInput: prompt, options })
  }
}

function parseJsonLoose(text) {
  if (!text) return text
  try { return JSON.parse(text) } catch (e) {}
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch (e) {}
  }
  return text
}
