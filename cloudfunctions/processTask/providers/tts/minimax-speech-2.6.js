// MiniMax Speech 2.6 — HD 高保真 / Turbo <250ms 实时
// ⚠️ MiniMax 无原生双人对话模式，需要按段分音色串行调用 + Buffer 拼接
// 端点：国内 api.minimaxi.chat；海外 api.minimax.io
// 鉴权：API Key (Bearer) + GroupId (URL query)
const VOICES = {
  A: process.env.MINIMAX_VOICE_A || 'male-qn-qingse',
  B: process.env.MINIMAX_VOICE_B || 'female-shaonv'
}

module.exports = {
  name: 'MiniMax Speech 2.6',
  model: 'speech-2.6-hd',
  vendor: 'minimax',
  nativeDialogue: false,  // 需要 app 层拼接

  async synthesizeDialogue(dialogue) {
    const buffers = []
    for (const { speaker, text } of dialogue) {
      const buf = await this._synthesizeOne(text, VOICES[speaker] || VOICES.A)
      buffers.push(buf)
    }
    return Buffer.concat(buffers)
  },

  async _synthesizeOne(text, voiceId) {
    const base = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.chat'
    const url = `${base}/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd',
        text,
        voice_setting: { voice_id: voiceId, speed: 1.0, vol: 1.0, pitch: 0 },
        audio_setting: { format: 'mp3', sample_rate: 32000, bitrate: 128000, channel: 1 }
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`MiniMax Speech error: ${resp.status} ${err}`)
    }
    const json = await resp.json()
    // t2a_v2 返回的是 hex 编码的音频，需要转 Buffer
    if (json.data?.audio) return Buffer.from(json.data.audio, 'hex')
    throw new Error(`MiniMax Speech: no audio in response: ${JSON.stringify(json).slice(0, 200)}`)
  }
}
