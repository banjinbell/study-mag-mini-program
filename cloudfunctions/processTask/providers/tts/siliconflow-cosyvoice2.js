// SiliconFlow 托管的 CosyVoice2 0.5B —— 性价比最高，$7.15 / M UTF-8 bytes
// OpenAI 兼容 audio/speech 端点，单音色合成
// ⚠️ 无原生双人，需要 app 层按角色切音色 + 拼接
const VOICES = {
  A: process.env.SF_VOICE_A || 'FunAudioLLM/CosyVoice2-0.5B:alex',
  B: process.env.SF_VOICE_B || 'FunAudioLLM/CosyVoice2-0.5B:anna'
}

module.exports = {
  name: 'SiliconFlow CosyVoice2',
  model: 'FunAudioLLM/CosyVoice2-0.5B',
  vendor: 'siliconflow',
  nativeDialogue: false,

  async synthesizeDialogue(dialogue) {
    const buffers = []
    for (const { speaker, text } of dialogue) {
      const buf = await this._synthesizeOne(text, VOICES[speaker] || VOICES.A)
      buffers.push(buf)
    }
    return Buffer.concat(buffers)
  },

  async _synthesizeOne(text, voice) {
    const resp = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'FunAudioLLM/CosyVoice2-0.5B',
        input: text,
        voice,
        response_format: 'mp3',
        sample_rate: 32000
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`SiliconFlow CosyVoice2 error: ${resp.status} ${err}`)
    }
    // OpenAI 兼容：直接返回音频二进制
    return Buffer.from(await resp.arrayBuffer())
  }
}
