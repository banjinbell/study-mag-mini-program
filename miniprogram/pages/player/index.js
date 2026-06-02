const api = require('../../utils/api')

const STATUS_LABEL = {
  pending: '排队中',
  processing: '撰稿中',
  done: '已刊',
  failed: '脱稿'
}

function fmt(sec) {
  if (!sec || isNaN(sec)) return '00:00'
  sec = Math.floor(sec)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s
}

function padNum(n) { return n < 10 ? '0' + n : String(n) }

function formatDate(d) {
  const yy = d.getFullYear()
  const mm = padNum(d.getMonth() + 1)
  const dd = padNum(d.getDate())
  return `${yy}·${mm}·${dd}`
}

// 64 chunky bars, deterministic heights in rpx (range ~10-50)
function generateWaveform(n) {
  n = n || 64
  const out = []
  for (let i = 0; i < n; i++) {
    const h = 10 + Math.abs(Math.sin(i * 0.42) + Math.cos(i * 0.27)) * 40
    out.push(Math.round(h))
  }
  return out
}

const WAVEFORM_BARS = 64

// 把含 **xxx** 标记的字符串切成 segments
// "本文解析 **memory policy** 概念，关键瓶颈 **ADD recall** 仍需突破"
// → [{type:'plain',text:'本文解析 '},{type:'highlight',text:'memory policy'},
//    {type:'plain',text:' 概念，关键瓶颈 '},{type:'highlight',text:'ADD recall'},
//    {type:'plain',text:' 仍需突破'}]
function parseHighlights(text) {
  if (!text) return []
  const out = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'plain', text: text.slice(last, m.index) })
    }
    out.push({ type: 'highlight', text: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    out.push({ type: 'plain', text: text.slice(last) })
  }
  // 无标记时返回单段 plain，wxml 用 wx:for 仍能渲染
  return out.length > 0 ? out : [{ type: 'plain', text }]
}

Page({
  data: {
    taskId: '',
    task: { status: 'pending', taskId: '' },
    statusLabel: '加载中',
    playing: false,
    currentTime: 0,
    duration: 0,
    currentTimeLabel: '00:00',
    durationLabel: '00:00',
    nowDate: '',

    // Manga UI derived state
    firstChar: '',
    restTitle: '',
    summarySegments: [],     // 导读分段（含 highlight 标记）
    waveformBars: [],
    playedBars: 0,
    openChapters: { 0: true },
    keyPointNums: [],
    chapterNums: [],
    keyPointsCount: '',
    chaptersCount: ''
  },

  watcher: null,
  bgm: null,

  onLoad(query) {
    const taskId = query.taskId
    if (!taskId) {
      wx.showToast({ title: '缺少 taskId', icon: 'error' })
      return
    }
    this.setData({
      taskId,
      'task.taskId': taskId,
      waveformBars: generateWaveform(WAVEFORM_BARS),
      nowDate: formatDate(new Date())
    })
    this.startWatch(taskId)
  },

  onUnload() {
    if (this.watcher) {
      try { this.watcher.close() } catch (e) {}
    }
    // 心跳 flush：离页前把累加的秒数推一次
    if (this._flushHeartbeat) {
      try { this._flushHeartbeat() } catch (e) {}
    }
    // 不停 BackgroundAudioManager —— 锁屏继续播
  },

  onHide() {
    // 切后台时也 flush 一次
    if (this._flushHeartbeat) {
      try { this._flushHeartbeat() } catch (e) {}
    }
  },

  startWatch(taskId) {
    this.watcher = api.watchTask(taskId, {
      onChange: (task) => {
        const label = STATUS_LABEL[task.status] || task.status
        const patch = { task, statusLabel: label }

        if (task.title) {
          patch.firstChar = task.title.slice(0, 1)
          patch.restTitle = task.title.slice(1)
        }
        if (task.summary) {
          patch.summarySegments = parseHighlights(task.summary)
        }
        if (task.keyPoints && task.keyPoints.length) {
          patch.keyPointNums = task.keyPoints.map((_, i) => padNum(i + 1))
          patch.keyPointsCount = padNum(task.keyPoints.length)
        }
        if (task.sections && task.sections.length) {
          patch.chapterNums = task.sections.map((_, i) => padNum(i + 1))
          patch.chaptersCount = padNum(task.sections.length)
        }

        this.setData(patch)

        if (task.status === 'done' && task.audioFileID && !this.bgm) {
          this.setupAudio(task)
        }
      },
      onError: () => {
        wx.showToast({ title: '订阅失败', icon: 'none' })
      }
    })
  },

  async setupAudio(task) {
    try {
      const url = await api.fileIdToUrl(task.audioFileID)
      const bgm = wx.getBackgroundAudioManager()
      bgm.title = (task.title || '学伴播客').slice(0, 30)
      bgm.singer = `${task.hostA || ''} · ${task.hostB || ''}`
      bgm.coverImgUrl = ''
      bgm.epname = '学伴'
      bgm.src = url

      // ─── 心跳：累计本次播放 session 的真实收听时长 ───
      // 策略：onPlay 开计时，onPause/onEnded/onStop 或每 30 秒 flush
      this._heartbeatLastTickAt = 0  // 上次 tick 时的 currentTime
      this._heartbeatAccumSec = 0    // 累计未上报秒数
      this._heartbeatLastFlush = 0   // 上次 flush 的 currentTime

      const flushHeartbeat = () => {
        if (this._heartbeatAccumSec >= 1) {
          api.recordListening(task.taskId, this._heartbeatAccumSec)
          this._heartbeatAccumSec = 0
        }
      }

      const onProgress = () => {
        const total = bgm.duration || 0
        const cur = bgm.currentTime || 0
        const played = total > 0 ? Math.round((cur / total) * WAVEFORM_BARS) : 0
        this.setData({
          currentTime: cur,
          duration: total,
          currentTimeLabel: fmt(cur),
          durationLabel: fmt(total),
          playedBars: played
        })

        // 心跳累加（正向播放才算，跳转倒退不算）
        if (this._heartbeatLastTickAt > 0) {
          const delta = cur - this._heartbeatLastTickAt
          // delta 在 0-2 秒之间认为是正常播放推进；过大说明 seek
          if (delta > 0 && delta < 2.5) {
            this._heartbeatAccumSec += delta
          }
        }
        this._heartbeatLastTickAt = cur

        // 每 30 秒 flush 一次
        if (this._heartbeatAccumSec >= 30) {
          flushHeartbeat()
        }
      }

      bgm.onPlay(() => {
        this.setData({ playing: true })
        this._heartbeatLastTickAt = bgm.currentTime || 0
      })
      bgm.onPause(() => {
        this.setData({ playing: false })
        flushHeartbeat()
      })
      bgm.onStop(() => {
        this.setData({ playing: false })
        flushHeartbeat()
      })
      bgm.onEnded(() => {
        this.setData({ playing: false, currentTime: 0, playedBars: 0 })
        flushHeartbeat()
      })
      bgm.onTimeUpdate(onProgress)
      bgm.onError(() => wx.showToast({ title: '音频加载失败', icon: 'none' }))

      this._flushHeartbeat = flushHeartbeat
      this.bgm = bgm
    } catch (e) {
      wx.showToast({ title: '加载音频失败', icon: 'none' })
      console.error(e)
    }
  },

  togglePlay() {
    if (!this.bgm) return
    if (this.data.playing) this.bgm.pause()
    else this.bgm.play()
  },

  onSeek(e) {
    if (!this.bgm) return
    this.bgm.seek(e.detail.value)
  },

  seekBy(e) {
    if (!this.bgm) return
    const delta = parseInt(e.currentTarget.dataset.delta)
    const t = Math.max(0, Math.min((this.bgm.currentTime || 0) + delta, this.data.duration || 0))
    this.bgm.seek(t)
  },

  goBack() {
    wx.navigateBack()
  },

  toggleChapter(e) {
    const idx = e.currentTarget.dataset.index
    const key = `openChapters.${idx}`
    this.setData({ [key]: !this.data.openChapters[idx] })
  }
})
