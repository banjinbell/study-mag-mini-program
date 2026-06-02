const fs = require('fs')
const path = require('path')
const textProviders = require('../providers/text')

// 简单 YAML frontmatter 解析（避免依赖 gray-matter）
function parseSkillMd(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, instruction: content.trim() }

  const meta = {}
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (key) meta[key] = val
  })

  return { meta, instruction: match[2].trim() }
}

async function runSkill(skillName, input, providerOverride) {
  const filePath = path.join(__dirname, `${skillName}.skill.md`)
  const raw = fs.readFileSync(filePath, 'utf8')
  const { meta, instruction } = parseSkillMd(raw)

  const providerKey = providerOverride
    || meta.preferred_model
    || process.env.TEXT_PROVIDER
    || 'deepseek-v3'

  const provider = textProviders[providerKey]
  if (!provider) throw new Error(`Unknown text provider: ${providerKey}`)

  // readerContext 是 processTask 从 userProfile 拼出来的字符串
  // 自动追加到 systemPrompt 末尾，所有下游 skill 透明受益
  let systemPrompt = instruction
  let cleanInput = input
  if (input && typeof input.readerContext === 'string' && input.readerContext.trim()) {
    systemPrompt = instruction + '\n' + input.readerContext
    cleanInput = { ...input }
    delete cleanInput.readerContext   // 移出 input，避免 LLM 见到两遍
  }

  return provider.runWithSkill({
    systemPrompt,
    userInput: cleanInput,
    options: {
      max_tokens: parseInt(meta.max_tokens) || 2000,
      temperature: parseFloat(meta.temperature) || 0.7
    }
  })
}

module.exports = { runSkill }
