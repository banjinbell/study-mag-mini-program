// ElevenLabs v3 Text-to-Dialogue — 当前国际 SOTA 原生双人对话
// 单请求 ≤10 voice + ≤2000 字符；70+ 语言含中文
// ⚠️ 海外端点，云函数访问可能不稳；需要做 retry / proxy
const VOICES = {
  A: process.env.EL_VOICE_A || 'pNInz6obpgDQGcFmaJgB',  // Adam
  B: process.env.EL_VOICE_B || 'EXAVITQu4vr4xnSDxMaL'   // Bella
}

module.exports = {
  name: 'ElevenLabs v3 Dialogue',
  model: 'eleven_v3',
  vendor: 'elevenlabs',
  nativeDialogue: true,

  async synthesizeDialogue(dialogue) {
    // 2000 字符上限：先尝试一次性合成，超长则分批
    const totalChars = dialogue.reduce((s, d) => s + d.text.length, 0)
    if (totalChars <= 1800) {
      return await this._synthesizeBatch(dialogue)
    }
    // 分批：按 ~1800 字符切
    const batches = []
    let cur = []
    let count = 0
    for (const turn of dialogue) {
      if (count + turn.text.length > 1800 && cur.length > 0) {
        batches.push(cur)
        cur = []
        count = 0
      }
      cur.push(turn)
      count += turn.text.length
    }
    if (cur.length) batches.push(cur)
    const buffers = []
    for (const batch of batches) {
      buffers.push(await this._synthesizeBatch(batch))
    }
    return Buffer.concat(buffers)
  },

  async _synthesizeBatch(dialogue) {
    const inputs = dialogue.map(({ speaker, text }) => ({
      text,
      voice_id: VOICES[speaker] || VOICES.A
    }))

    const resp = await fetch('https://api.elevenlabs.io/v1/text-to-dialogue', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        accept: 'audio/mpeg'
      },
      body: JSON.stringify({
        model_id: 'eleven_v3',
        inputs,
        stability: 0.5,
        similarity_boost: 0.75
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`ElevenLabs v3 Dialogue error: ${resp.status} ${err}`)
    }
    return Buffer.from(await resp.arrayBuffer())
  }
}
