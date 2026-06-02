// 腾讯云大模型播客 TTS —— 原生双人，CloudBase 同机房延迟最低
// 端点：wss://tts.cloud.tencent.com/stream_ws_podcast
// 鉴权：HmacSHA1 签名 (基于腾讯云 SecretId/SecretKey)
// 输出：仅支持 pcm 24kHz，使用方需自行转 mp3
// 协议流程：connect → ready=1 → 发 ACTION_SYNTHESIS（文本）→ 发 ACTION_COMPLETE → 流式接收音频 → final=1 关闭
// 文档：https://cloud.tencent.com/document/product/1073/124700
const WebSocket = require('ws')
const crypto = require('crypto')

const SPEAKERS = {
  A: parseInt(process.env.TENCENT_PODCAST_SPEAKER_A || '101001'),
  B: parseInt(process.env.TENCENT_PODCAST_SPEAKER_B || '101002')
}

module.exports = {
  name: 'Tencent Podcast',
  model: 'tencent-podcast',
  vendor: 'tencent',
  nativeDialogue: true,
  outputFormat: 'pcm',
  outputSampleRate: 24000,

  async synthesizeDialogue(dialogue) {
    const text = dialogue
      .map(({ speaker, text }) => `${speaker === 'A' ? '【主持人A】' : '【主持人B】'}${text}`)
      .join('\n')

    const sessionId = crypto.randomBytes(16).toString('hex')
    const timestamp = Math.floor(Date.now() / 1000)
    const expired = timestamp + 86400

    // URL 参数（流式模式：Text 不放 URL 里，留空字符串以满足签名）
    const params = {
      Action: 'TextToPodcastStreamAudioWS',
      AppId: parseInt(process.env.TENCENT_APP_ID),
      SecretId: process.env.TENCENT_SECRET_ID,
      Timestamp: timestamp,
      Expired: expired,
      SessionId: sessionId,
      SampleRate: 24000,
      Codec: 'pcm',
      SpeakerNumber: 2,
      Speaker1Voice: SPEAKERS.A,
      Speaker2Voice: SPEAKERS.B
    }

    // 签名：按 key 排序，值用原始字符串
    const sortedKeys = Object.keys(params).sort()
    const signQs = sortedKeys.map(k => `${k}=${params[k]}`).join('&')
    const signSource = `GETtts.cloud.tencent.com/stream_ws_podcast?${signQs}`
    const signature = crypto
      .createHmac('sha1', process.env.TENCENT_SECRET_KEY)
      .update(signSource)
      .digest('base64')
    const url = `wss://tts.cloud.tencent.com/stream_ws_podcast?${signQs}&Signature=${encodeURIComponent(signature)}`

    return await new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      const chunks = []
      let synthesisStarted = false

      ws.on('open', () => {
        if (process.env.DEBUG) console.log('[tencent-podcast] WS opened')
      })

      ws.on('message', (data, isBinary) => {
        const buf = Buffer.from(data)
        // 控制帧：JSON 文本帧，以 '{' 开头
        const isJson = !isBinary && buf.length < 4096 && buf[0] === 0x7b
        if (isJson) {
          let msg
          try { msg = JSON.parse(buf.toString()) } catch {
            chunks.push(buf)
            return
          }

          if (msg.code !== undefined && msg.code !== 0) {
            reject(new Error(`Tencent Podcast error code=${msg.code}: ${msg.message}`))
            ws.close()
            return
          }

          // ready=1：发起合成
          if (msg.ready === 1 && !synthesisStarted) {
            synthesisStarted = true
            ws.send(JSON.stringify({
              session_id: sessionId,
              message_id: crypto.randomUUID(),
              action: 'ACTION_SYNTHESIS',
              data: JSON.stringify({ ObjectType: 'TYPE_TEXT', Text: text })
            }))
            ws.send(JSON.stringify({
              session_id: sessionId,
              message_id: crypto.randomUUID(),
              action: 'ACTION_COMPLETE',
              data: ''
            }))
            if (process.env.DEBUG) console.log('[tencent-podcast] sent ACTION_SYNTHESIS + ACTION_COMPLETE')
            return
          }

          if (msg.final === 1) {
            ws.close(1000)
            return
          }
          // heartbeat / 其他：忽略
        } else {
          chunks.push(buf)
          if (process.env.DEBUG) console.log(`[tencent-podcast] audio chunk +${buf.length} (total ${chunks.reduce((s, c) => s + c.length, 0)})`)
        }
      })

      ws.on('close', () => {
        if (chunks.length === 0) return reject(new Error('Tencent Podcast: no audio received'))
        resolve(Buffer.concat(chunks))
      })

      ws.on('error', (err) => {
        reject(new Error(`Tencent Podcast WS error: ${err.message}`))
      })

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
          reject(new Error('Tencent Podcast timeout (3min)'))
        }
      }, 180000)
    })
  }
}
