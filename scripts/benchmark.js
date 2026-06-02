#!/usr/bin/env node
// 学伴 Phase 1 模型对比脚本
// 用法：
//   node benchmark.js text                 # 跑所有文本 provider
//   node benchmark.js vision               # 跑所有视觉 provider（需 fixtures/*.jpg）
//   node benchmark.js tts                  # 跑所有 TTS provider，生成 mp3
//   node benchmark.js all                  # 全部
//   node benchmark.js text deepseek-v4-flash    # 只跑指定 provider
//
// 输出：output/benchmark-results.json + output/tts-*.mp3

require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, 'output')
const FIXTURES_DIR = path.join(__dirname, 'fixtures')

// Provider 文件用 process.env 拿 key，本地直接 require 也能跑
// 前提：Node 18+ 自带 fetch；本地 scripts/ 下 npm install 了 ws
const PROVIDERS_ROOT = path.join(__dirname, '..', 'cloudfunctions', 'processTask', 'providers')
const visionProviders = require(path.join(PROVIDERS_ROOT, 'vision'))
const textProviders = require(path.join(PROVIDERS_ROOT, 'text'))
const ttsProviders = require(path.join(PROVIDERS_ROOT, 'tts'))

// 测试输入
const TEST_TEXTS = ['wechat-theory.txt', 'wechat-story.txt']
  .filter(f => fs.existsSync(path.join(FIXTURES_DIR, f)))
  .map(f => ({ name: f, content: fs.readFileSync(path.join(FIXTURES_DIR, f), 'utf8') }))

const TEST_DIALOGUE = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'sample-dialogue.json'), 'utf8')
)

const TEST_IMAGES = fs.readdirSync(FIXTURES_DIR)
  .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  .map(f => ({ name: f, path: path.join(FIXTURES_DIR, f) }))

// 检查 Key 是否填了
function hasKey(provider) {
  const v = provider.vendor
  const checks = {
    alibaba:     ['DASHSCOPE_API_KEY'],
    deepseek:    ['DEEPSEEK_API_KEY'],
    volcengine:  ['ARK_API_KEY'],
    tencent:     ['HUNYUAN_API_KEY'],
    zhipu:       ['ZHIPU_API_KEY'],
    moonshot:    ['MOONSHOT_API_KEY'],
    minimax:     ['MINIMAX_API_KEY'],
    siliconflow: ['SILICONFLOW_API_KEY'],
    elevenlabs:  ['ELEVENLABS_API_KEY']
  }
  const needed = checks[v]
  if (!needed) return true
  return needed.every(k => process.env[k] && process.env[k].length > 0)
}

function hasTtsKey(providerName) {
  if (providerName === 'doubao-podcast') return !!(process.env.VOLC_TTS_APP_KEY && process.env.VOLC_TTS_ACCESS_KEY)
  if (providerName === 'tencent-podcast') return !!(process.env.TENCENT_APP_ID && process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY)
  if (providerName === 'minimax-speech-2.6') return !!(process.env.MINIMAX_API_KEY && process.env.MINIMAX_GROUP_ID)
  if (providerName === 'siliconflow-cosyvoice2') return !!process.env.SILICONFLOW_API_KEY
  if (providerName === 'elevenlabs-v3-dialogue') return !!process.env.ELEVENLABS_API_KEY
  return true
}

const results = []
const args = process.argv.slice(2)
const mode = args[0] || 'all'
const filter = args[1]

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

async function benchVision() {
  console.log('\n========== Vision Benchmark ==========')
  if (!TEST_IMAGES.length) {
    console.log('⚠️  fixtures/ 里没有 .jpg/.png 图片，跳过 vision。可放小红书/公众号截图后再跑。')
    return
  }
  for (const [key, provider] of Object.entries(visionProviders)) {
    if (filter && key !== filter) continue
    if (!hasKey(provider)) { console.log(`⏭  ${key}: 跳过（缺 API Key）`); continue }
    for (const img of TEST_IMAGES) {
      const base64 = fs.readFileSync(img.path).toString('base64')
      const t0 = Date.now()
      try {
        const output = await provider.describe(base64)
        const ms = Date.now() - t0
        console.log(`✅ ${key} / ${img.name}: ${ms}ms, ${output.length} chars`)
        console.log(`   预览: ${output.slice(0, 120).replace(/\n/g, ' ')}...`)
        results.push({ category: 'vision', provider: key, input: img.name, latencyMs: ms, output: output.slice(0, 500), outputLen: output.length, success: true })
      } catch (e) {
        const ms = Date.now() - t0
        console.log(`❌ ${key} / ${img.name}: ${e.message}`)
        results.push({ category: 'vision', provider: key, input: img.name, latencyMs: ms, error: String(e), success: false })
      }
    }
  }
}

async function benchText() {
  console.log('\n========== Text Benchmark ==========')
  console.log('任务：从测试内容中提取 5-10 个核心概念\n')
  for (const [key, provider] of Object.entries(textProviders)) {
    if (filter && key !== filter) continue
    if (!hasKey(provider)) { console.log(`⏭  ${key}: 跳过（缺 API Key）`); continue }
    for (const text of TEST_TEXTS) {
      const prompt = `请从以下内容中提取 5-10 个核心概念，每个 2-6 字。只返回 JSON：{"concepts": ["概念1","概念2",...]}\n\n内容：\n${text.content.slice(0, 3000)}`
      const t0 = Date.now()
      try {
        const out = await provider.runRaw(prompt, { max_tokens: 500, temperature: 0.3 })
        const ms = Date.now() - t0
        const raw = typeof out === 'string' ? out : JSON.stringify(out)
        let concepts = []
        try {
          const j = typeof out === 'string' ? JSON.parse(out) : out
          concepts = j.concepts || []
        } catch {}
        console.log(`✅ ${key} / ${text.name}: ${ms}ms, ${concepts.length} 概念`)
        if (concepts.length) console.log(`   ${concepts.slice(0, 6).join('、')}${concepts.length > 6 ? '...' : ''}`)
        results.push({ category: 'text', provider: key, input: text.name, latencyMs: ms, output: raw.slice(0, 800), concepts, success: true })
      } catch (e) {
        const ms = Date.now() - t0
        console.log(`❌ ${key} / ${text.name}: ${e.message}`)
        results.push({ category: 'text', provider: key, input: text.name, latencyMs: ms, error: String(e), success: false })
      }
    }
  }
}

async function benchTts() {
  console.log('\n========== TTS Benchmark ==========')
  console.log(`任务：合成测试 dialogue（${TEST_DIALOGUE.length} 轮对话）为 mp3\n`)
  for (const [key, provider] of Object.entries(ttsProviders)) {
    if (filter && key !== filter) continue
    if (!hasTtsKey(key)) { console.log(`⏭  ${key}: 跳过（缺 API Key）`); continue }
    const t0 = Date.now()
    try {
      const audio = await provider.synthesizeDialogue(TEST_DIALOGUE)
      const ms = Date.now() - t0
      const ext = provider.outputFormat === 'pcm' ? 'pcm' : 'mp3'
      const rawFile = path.join(OUTPUT_DIR, `tts-${key}.${ext}`)
      fs.writeFileSync(rawFile, audio)
      const kb = (audio.length / 1024).toFixed(1)
      console.log(`✅ ${key}: ${ms}ms, ${kb} KB → ${path.relative(process.cwd(), rawFile)}`)

      // pcm → mp3 自动转码
      let finalFile = rawFile
      if (provider.outputFormat === 'pcm') {
        finalFile = await convertPcmToMp3(rawFile, provider.outputSampleRate || 24000)
        console.log(`   转码: ${path.relative(process.cwd(), finalFile)}`)
      }

      results.push({ category: 'tts', provider: key, latencyMs: ms, sizeBytes: audio.length, outputFile: finalFile, nativeDialogue: provider.nativeDialogue, success: true })
    } catch (e) {
      const ms = Date.now() - t0
      console.log(`❌ ${key}: ${e.message}`)
      results.push({ category: 'tts', provider: key, latencyMs: ms, error: String(e), success: false })
    }
  }
}

async function convertPcmToMp3(pcmPath, sampleRate) {
  const ffmpegPath = require('ffmpeg-static')
  const { spawn } = require('child_process')
  const mp3Path = pcmPath.replace(/\.pcm$/, '.mp3')

  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-y',
      '-f', 's16le',
      '-ar', String(sampleRate),
      '-ac', '1',
      '-i', pcmPath,
      '-codec:a', 'libmp3lame',
      '-qscale:a', '4',
      mp3Path
    ], { stdio: 'pipe' })
    let stderr = ''
    ff.stderr.on('data', d => { stderr += d.toString() })
    ff.on('close', code => {
      if (code === 0) resolve(mp3Path)
      else reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-200)}`))
    })
  })
}

;(async () => {
  console.log(`\n模式：${mode}${filter ? ` / 过滤：${filter}` : ''}`)

  if (mode === 'text' || mode === 'all') await benchText()
  if (mode === 'vision' || mode === 'all') await benchVision()
  if (mode === 'tts' || mode === 'all') await benchTts()

  const resultsFile = path.join(OUTPUT_DIR, 'benchmark-results.json')
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))

  // 汇总
  const summary = {}
  for (const r of results) {
    const k = `${r.category}/${r.provider}`
    if (!summary[k]) summary[k] = { ok: 0, fail: 0, totalMs: 0 }
    if (r.success) summary[k].ok++; else summary[k].fail++
    summary[k].totalMs += r.latencyMs || 0
  }
  console.log('\n========== 汇总 ==========')
  for (const [k, v] of Object.entries(summary)) {
    const total = v.ok + v.fail
    const avgMs = Math.round(v.totalMs / total)
    const status = v.fail === 0 ? '✅' : (v.ok === 0 ? '❌' : '⚠️')
    console.log(`${status} ${k}: ${v.ok}/${total} 成功, 平均 ${avgMs}ms`)
  }
  console.log(`\n详细结果：${path.relative(process.cwd(), resultsFile)}`)
  if (results.some(r => r.category === 'tts' && r.success)) {
    console.log(`TTS 音频：${path.relative(process.cwd(), OUTPUT_DIR)}/tts-*.mp3 — 请人工试听打分`)
  }
  console.log()
})()
