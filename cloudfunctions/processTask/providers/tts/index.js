// TTS Provider 注册表
// 标 nativeDialogue=true 的 provider 支持原生双人播客（无需 app 层拼接）
module.exports = {
  // 原生双人对话 - 三选一
  'doubao-podcast':       require('./doubao-podcast'),       // 火山，WSS V3
  'tencent-podcast':      require('./tencent-podcast'),      // 腾讯，CloudBase 同机房
  'elevenlabs-v3-dialogue': require('./elevenlabs-v3-dialogue'), // 海外 SOTA

  // 单音色拼接型（自己 concat 两个 voice_id）
  'minimax-speech-2.6':       require('./minimax-speech-2.6'),
  'siliconflow-cosyvoice2':   require('./siliconflow-cosyvoice2')
}
