// 文本模型注册表
// 用环境变量 TEXT_PROVIDER 切换主默认；skill 文件的 preferred_model 字段可以单独覆盖
module.exports = {
  // DeepSeek 官方
  'deepseek-v4-flash': require('./deepseek-v4-flash'),
  'deepseek-v4-pro':   require('./deepseek-v4-pro'),

  // 阿里通义 Qwen
  'qwen3.7-max':  require('./qwen3.7-max'),
  'qwen-plus':    require('./qwen-plus'),

  // 火山豆包
  'doubao-seed-1.6': require('./doubao-seed-1.6'),

  // 腾讯混元（走 TokenHub）
  'hy3-preview': require('./hy3-preview'),

  // 智谱
  'glm-4.6': require('./glm-4.6'),

  // Moonshot
  'kimi-k2.6': require('./kimi-k2.6'),

  // MiniMax
  'minimax-m2': require('./minimax-m2')
}
