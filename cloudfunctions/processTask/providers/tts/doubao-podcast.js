// 豆包语音播客大模型 (Volcengine SAMI) —— 原生双人播客
// 协议：WebSocket V3 二进制帧（基于官方 TypeScript SDK 改写）
// 文档：https://docs.volcengine.com/docs/6561/1668014
//
// 协议核心（来自官方 SDK src/protocols.ts）：
//   MsgType:  FullClientRequest=1, AudioOnlyClient=2, FullServerResponse=9, AudioOnlyServer=11, Error=15
//   Flag:     WithEvent=0b100
//   byte[1] = (msgType<<4) | flag
//   客户端 FullClientRequest+WithEvent: 0x14
//   服务端 FullServerResponse+WithEvent: 0x94
//   服务端 AudioOnlyServer+WithEvent: 0xB4
//
// 流程（来自 src/volcengine/podcasts.ts）：
//   1. StartConnection(1) → 等 ConnectionStarted(50)
//   2. StartSession(100, payload, session_id) → 等 SessionStarted(150)
//   3. FinishSession(102) 立即发
//   4. 循环：接收 PodcastRoundStart(360) / PodcastRoundResponse(361 音频) / PodcastRoundEnd(362) / PodcastEnd(363) → SessionFinished(152) 跳出
//   5. FinishConnection(2) → 等 ConnectionFinished(52) → 关闭
//
// 注意：session_id 字段对 ConnectionStarted/Failed/Finished 不写不读，其他事件都带
const WebSocket = require('ws')
const crypto = require('crypto')

const ENDPOINT = process.env.VOLC_PODCAST_ENDPOINT
  || 'wss://openspeech.bytedance.com/api/v3/sami/podcasttts'
const APP_KEY_FIXED = 'aGjiRDfUWi'
const RESOURCE_ID = process.env.VOLC_PODCAST_RESOURCE_ID || 'volc.service_type.10050'

const DEFAULT_SPEAKER_A = 'zh_male_dayixiansheng_v2_saturn_bigtts'
const DEFAULT_SPEAKER_B = 'zh_female_mizaitongxue_v2_saturn_bigtts'

const MsgType = {
  FullClientRequest:  0b0001,
  AudioOnlyClient:    0b0010,
  FullServerResponse: 0b1001,
  AudioOnlyServer:    0b1011,
  Error:              0b1111
}

const Flag = {
  NoSeq:     0b0000,
  WithEvent: 0b0100
}

const EVENT = {
  None: 0,
  StartConnection: 1, FinishConnection: 2,
  ConnectionStarted: 50, ConnectionFailed: 51, ConnectionFinished: 52,
  StartSession: 100, CancelSession: 101, FinishSession: 102,
  SessionStarted: 150, SessionCanceled: 151, SessionFinished: 152, SessionFailed: 153, UsageResponse: 154,
  PodcastRoundStart: 360, PodcastRoundResponse: 361, PodcastRoundEnd: 362, PodcastEnd: 363
}

// === 编码 ===
function marshalMessage({ msgType, flag, event, sessionId, payload, serialization = 0b0001, compression = 0 }) {
  const header = Buffer.from([
    (1 << 4) | 1,                         // version=1, header_size=4(1*4)
    (msgType << 4) | flag,
    (serialization << 4) | compression,
    0x00                                  // reserved
  ])

  const buffers = [header]

  if (flag === Flag.WithEvent) {
    // event (uint32 BE)
    const eb = Buffer.alloc(4); eb.writeInt32BE(event, 0)
    buffers.push(eb)

    // session_id（只对非连接类事件写）
    if (![EVENT.StartConnection, EVENT.FinishConnection, EVENT.ConnectionStarted, EVENT.ConnectionFailed].includes(event)) {
      const sid = Buffer.from(sessionId || '', 'utf8')
      const sl = Buffer.alloc(4); sl.writeUInt32BE(sid.length, 0)
      buffers.push(sl, sid)
    }
  }

  // payload
  const pl = Buffer.alloc(4); pl.writeUInt32BE(payload.length, 0)
  buffers.push(pl, payload)

  return Buffer.concat(buffers)
}

// === 解码 ===
function unmarshalMessage(buf) {
  if (buf.length < 3) throw new Error(`frame too short: ${buf.length}`)

  const version = (buf[0] >> 4) & 0x0F
  const headerSize = buf[0] & 0x0F
  const msgType = (buf[1] >> 4) & 0x0F
  const flag = buf[1] & 0x0F
  const serialization = (buf[2] >> 4) & 0x0F
  const compression = buf[2] & 0x0F

  let offset = 4 * headerSize  // 跳过 header（含 reserved）

  const msg = { version, headerSize, msgType, flag, serialization, compression }

  // 按 msgType 读
  if (msgType === MsgType.Error) {
    msg.errorCode = buf.readUInt32BE(offset); offset += 4
  }

  // 按 flag 读 event + session_id + connect_id
  if (flag === Flag.WithEvent) {
    msg.event = buf.readInt32BE(offset); offset += 4

    // session_id（连接类事件不读）
    if (![EVENT.StartConnection, EVENT.FinishConnection, EVENT.ConnectionStarted, EVENT.ConnectionFailed, EVENT.ConnectionFinished].includes(msg.event)) {
      const sl = buf.readUInt32BE(offset); offset += 4
      if (sl > 0) { msg.sessionId = buf.slice(offset, offset + sl).toString('utf8'); offset += sl }
    }

    // connect_id（仅 ConnectionStarted/Failed/Finished 读）
    if ([EVENT.ConnectionStarted, EVENT.ConnectionFailed, EVENT.ConnectionFinished].includes(msg.event)) {
      const cl = buf.readUInt32BE(offset); offset += 4
      if (cl > 0) { msg.connectId = buf.slice(offset, offset + cl).toString('utf8'); offset += cl }
    }
  }

  // payload
  if (offset + 4 <= buf.length) {
    const pl = buf.readUInt32BE(offset); offset += 4
    msg.payload = buf.slice(offset, offset + pl)
  } else {
    msg.payload = Buffer.alloc(0)
  }

  return msg
}

const JSON_ENC = (obj) => Buffer.from(JSON.stringify(obj), 'utf8')

function sendStartConnection(ws) {
  return _send(ws, marshalMessage({
    msgType: MsgType.FullClientRequest, flag: Flag.WithEvent,
    event: EVENT.StartConnection, payload: JSON_ENC({})
  }))
}

function sendStartSession(ws, sessionId, payloadObj) {
  return _send(ws, marshalMessage({
    msgType: MsgType.FullClientRequest, flag: Flag.WithEvent,
    event: EVENT.StartSession, sessionId, payload: JSON_ENC(payloadObj)
  }))
}

function sendFinishSession(ws, sessionId) {
  return _send(ws, marshalMessage({
    msgType: MsgType.FullClientRequest, flag: Flag.WithEvent,
    event: EVENT.FinishSession, sessionId, payload: JSON_ENC({})
  }))
}

function sendFinishConnection(ws) {
  return _send(ws, marshalMessage({
    msgType: MsgType.FullClientRequest, flag: Flag.WithEvent,
    event: EVENT.FinishConnection, payload: JSON_ENC({})
  }))
}

function _send(ws, data) {
  return new Promise((resolve, reject) => {
    ws.send(data, (err) => err ? reject(err) : resolve())
  })
}

// 等待特定 event（返回该消息），其他消息按回调处理或忽略
function waitFor(ws, predicate, onOther, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const onMsg = (data) => {
      try {
        const msg = unmarshalMessage(Buffer.from(data))
        if (predicate(msg)) {
          ws.off('message', onMsg)
          clearTimeout(timer)
          return resolve(msg)
        }
        if (onOther) onOther(msg)
      } catch (e) {
        ws.off('message', onMsg)
        clearTimeout(timer)
        reject(e)
      }
    }
    const timer = setTimeout(() => {
      ws.off('message', onMsg)
      reject(new Error(`waitFor timeout after ${timeoutMs}ms`))
    }, timeoutMs)
    ws.on('message', onMsg)
  })
}

module.exports = {
  name: 'Doubao Podcast',
  model: 'volc.service_type.10050',
  vendor: 'volcengine',
  nativeDialogue: true,
  outputFormat: 'mp3',
  outputSampleRate: 24000,

  async synthesizeDialogue(dialogue) {
    const speakerA = process.env.VOLC_PODCAST_SPEAKER_A || DEFAULT_SPEAKER_A
    const speakerB = process.env.VOLC_PODCAST_SPEAKER_B || DEFAULT_SPEAKER_B
    const nlp_texts = dialogue.map(({ speaker, text }) => ({
      speaker: speaker === 'A' ? speakerA : speakerB,
      text
    }))
    return this._call({
      input_id: 'task_' + crypto.randomBytes(6).toString('hex'),
      action: 3,
      use_head_music: false,
      use_tail_music: false,
      audio_config: { format: 'mp3', sample_rate: 24000, speech_rate: 0 },
      speaker_info: { random_order: false, speakers: [speakerA, speakerB] },
      nlp_texts
    })
  },

  // action=0：直接喂长文本，火山自己写稿+生成
  async synthesizeFromText(inputText, opts = {}) {
    const speakerA = process.env.VOLC_PODCAST_SPEAKER_A || DEFAULT_SPEAKER_A
    const speakerB = process.env.VOLC_PODCAST_SPEAKER_B || DEFAULT_SPEAKER_B
    return this._call({
      input_id: 'task_' + crypto.randomBytes(6).toString('hex'),
      action: 0,
      input_text: inputText,
      use_head_music: false,
      use_tail_music: false,
      audio_config: { format: 'mp3', sample_rate: 24000, speech_rate: 0 },
      speaker_info: { random_order: false, speakers: [speakerA, speakerB] },
      ...opts
    })
  },

  async _call(reqParams) {
    const appId = process.env.VOLC_TTS_APP_ID || process.env.VOLC_TTS_APP_KEY
    const accessKey = process.env.VOLC_TTS_ACCESS_KEY
    if (!appId || !accessKey) {
      throw new Error('Doubao Podcast: VOLC_TTS_APP_ID + VOLC_TTS_ACCESS_KEY required')
    }

    const headers = {
      'X-Api-App-Id':      String(appId),
      'X-Api-App-Key':     APP_KEY_FIXED,
      'X-Api-Access-Key':  accessKey,
      'X-Api-Resource-Id': RESOURCE_ID,
      'X-Api-Connect-Id':  crypto.randomUUID()
    }

    const ws = new WebSocket(ENDPOINT, { headers, handshakeTimeout: 10000, skipUTF8Validation: true })
    const podcastAudio = []
    const D = (...args) => { if (process.env.DEBUG) console.log('[doubao-podcast]', ...args) }

    try {
      // 1) WSS open
      await new Promise((resolve, reject) => {
        const onOpen = () => { ws.off('error', onErr); resolve() }
        const onErr = (e) => { ws.off('open', onOpen); reject(e) }
        ws.once('open', onOpen)
        ws.once('error', onErr)
        ws.once('unexpected-response', (req, res) => {
          let body = ''
          res.on('data', d => body += d)
          res.on('end', () => reject(new Error(`handshake ${res.statusCode}: ${body.slice(0, 300)}`)))
        })
      })
      D('WS opened')

      // 2) StartConnection → ConnectionStarted
      await sendStartConnection(ws)
      await waitFor(ws, m => m.event === EVENT.ConnectionStarted)
      D('ConnectionStarted')

      // 3) StartSession → SessionStarted
      const sessionId = crypto.randomUUID()
      await sendStartSession(ws, sessionId, reqParams)
      await waitFor(ws, m => m.event === EVENT.SessionStarted)
      D('SessionStarted')

      // 4) FinishSession（告诉服务端"我发完了，开始合成"）
      await sendFinishSession(ws, sessionId)

      // 5) 循环接收 Podcast 帧直到 SessionFinished
      await waitFor(ws,
        m => m.event === EVENT.SessionFinished,
        m => {
          if (m.msgType === MsgType.Error) {
            throw new Error(`Server error code=${m.errorCode}: ${m.payload.toString('utf8')}`)
          }
          if (m.event === EVENT.PodcastRoundResponse && m.msgType === MsgType.AudioOnlyServer) {
            podcastAudio.push(m.payload)
            D(`audio chunk +${m.payload.length}B (total ${podcastAudio.reduce((s, b) => s + b.length, 0)}B)`)
          } else if (m.event === EVENT.PodcastRoundStart) {
            D('PodcastRoundStart', m.payload.toString('utf8').slice(0, 80))
          } else if (m.event === EVENT.PodcastRoundEnd) {
            D('PodcastRoundEnd', m.payload.toString('utf8').slice(0, 80))
          } else if (m.event === EVENT.PodcastEnd) {
            D('PodcastEnd', m.payload.toString('utf8').slice(0, 100))
          } else if (m.event === EVENT.UsageResponse) {
            D('UsageResponse', m.payload.toString('utf8'))
          }
        },
        300000  // 5min
      )
      D(`SessionFinished, total audio ${podcastAudio.reduce((s, b) => s + b.length, 0)}B`)

      // 6) FinishConnection → ConnectionFinished
      await sendFinishConnection(ws)
      await waitFor(ws, m => m.event === EVENT.ConnectionFinished, null, 10000)

      if (podcastAudio.length === 0) throw new Error('Doubao Podcast: no audio received')
      return Buffer.concat(podcastAudio)
    } finally {
      try { ws.close() } catch {}
    }
  }
}
