// 视觉模型注册表
module.exports = {
  'qwen3-vl-plus':    require('./qwen3-vl-plus'),
  'doubao-vision':    require('./doubao-vision'),
  'hunyuan-vision':   require('./hunyuan-vision'),
  'youtu-vita':       require('./youtu-vita'),         // 腾讯优图，走 TokenHub
  'glm-4.6v':         require('./glm-4.6v')
}
