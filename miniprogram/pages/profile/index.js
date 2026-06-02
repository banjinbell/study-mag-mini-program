const api = require('../../utils/api')

const TONE_OPTIONS = [
  '严肃学术', '轻松日常', '反共识犀利', '工具方法论',
  '故事化讲述', '速度快', '慢节奏'
]
const PRESET_TOPICS = [
  'AI', '商业', '心理学', '设计', '编程',
  '哲学', '行为经济学', '历史', '科学', '文学'
]

function toMap(arr) {
  const m = {}
  if (Array.isArray(arr)) for (const k of arr) m[k] = true
  return m
}

Page({
  data: {
    TONE_OPTIONS,
    allTopics: PRESET_TOPICS.slice(),
    form: {
      identity: '',
      level: 'mid',   // 默认中等密度
      tones: [],
      topics: []
    },
    // slider 数值：0=new(轻), 1=mid(中), 2=expert(密)
    densityValue: 1,
    densityLabels: ['轻 / LIGHT', '中 / MED', '密 / DENSE'],
    toneMap: {},
    topicMap: {},
    canSave: false,
    saving: false,
    // stats
    stats: null,
    profileLoaded: false
  },

  onLoad() {
    this.loadAll()
  },

  onShow() {
    const tab = this.getTabBar && this.getTabBar()
    if (tab && tab.setData) tab.setData({ selected: 2 })
    // 每次进页面都拉一次最新 stats（收听数据可能在 player 页更新过）
    if (this.data.profileLoaded) this.loadStats()
  },

  async loadAll() {
    wx.showLoading({ title: '读取约稿单…', mask: true })
    try {
      await Promise.all([this.loadProfile(), this.loadStats()])
    } catch (e) {
      console.error('[profile] loadAll:', e)
    } finally {
      wx.hideLoading()
    }
  },

  async loadProfile() {
    const res = await api.getProfile()
    if (res.empty || !res.profile) {
      this.setData({ profileLoaded: true })
      return
    }
    const p = res.profile
    const form = {
      identity: p.identity || '',
      level: p.level || 'mid',
      tones: Array.isArray(p.tones) ? p.tones : [],
      topics: Array.isArray(p.topics) ? p.topics : []
    }
    // 把用户的自定义 topics 也合并到选项里
    const customTopics = form.topics.filter(t => !PRESET_TOPICS.includes(t))
    const allTopics = [...PRESET_TOPICS, ...customTopics]

    const levelToValue = { new: 0, mid: 1, expert: 2 }

    this.setData({
      form,
      toneMap: toMap(form.tones),
      topicMap: toMap(form.topics),
      allTopics,
      densityValue: levelToValue[form.level] !== undefined ? levelToValue[form.level] : 1,
      profileLoaded: true
    }, () => {
      this.refreshCanSave()
    })
  },

  async loadStats() {
    try {
      const stats = await api.getReadingStats()
      if (stats && stats.success) this.setData({ stats })
    } catch (e) {
      console.warn('[profile] loadStats:', e)
    }
  },

  onIdentityInput(e) {
    this.setData({ 'form.identity': (e.detail.value || '').slice(0, 20) }, () => this.refreshCanSave())
  },

  onDensityChange(e) {
    const v = e.detail.value
    const valueToLevel = ['new', 'mid', 'expert']
    this.setData({
      densityValue: v,
      'form.level': valueToLevel[v] || 'mid'
    }, () => this.refreshCanSave())
  },

  onToneTap(e) {
    const tone = e.currentTarget.dataset.tone
    const tones = this.data.form.tones.slice()
    const i = tones.indexOf(tone)
    if (i >= 0) tones.splice(i, 1)
    else tones.push(tone)
    this.setData({
      'form.tones': tones,
      toneMap: toMap(tones)
    }, () => this.refreshCanSave())
  },

  onTopicTap(e) {
    const topic = e.currentTarget.dataset.topic
    const topics = this.data.form.topics.slice()
    const i = topics.indexOf(topic)
    if (i >= 0) topics.splice(i, 1)
    else topics.push(topic)
    this.setData({
      'form.topics': topics,
      topicMap: toMap(topics)
    }, () => this.refreshCanSave())
  },

  async onAddTopic() {
    const res = await new Promise((resolve) => {
      wx.showModal({
        title: '加新关注 · ADD TOPIC',
        editable: true,
        placeholderText: '例：复利 / 系统设计 / 神经科学',
        confirmText: '加上',
        cancelText: '取消',
        success: (r) => resolve(r),
        fail: () => resolve(null)
      })
    })
    if (!res || !res.confirm) return
    const t = (res.content || '').trim().slice(0, 12).replace(/^#/, '')
    if (!t) return
    if (this.data.form.topics.includes(t)) return

    const allTopics = this.data.allTopics.includes(t)
      ? this.data.allTopics
      : [...this.data.allTopics, t]
    const topics = [...this.data.form.topics, t]
    this.setData({
      allTopics,
      'form.topics': topics,
      topicMap: toMap(topics)
    }, () => this.refreshCanSave())
  },

  refreshCanSave() {
    const { identity, level, tones, topics } = this.data.form
    const can = identity.trim().length > 0 && !!level && tones.length > 0 && topics.length > 0 && !this.data.saving
    this.setData({ canSave: can })
  },

  async onSave() {
    if (!this.data.canSave) return
    this.setData({ saving: true }, () => this.refreshCanSave())
    wx.showLoading({ title: '存档中…', mask: true })

    try {
      await api.saveProfile(this.data.form)
      wx.hideLoading()
      wx.showToast({ title: '已存档', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '存档失败: ' + (e.message || e), icon: 'none' })
    } finally {
      this.setData({ saving: false }, () => this.refreshCanSave())
    }
  },

  // 点日历格显示当天分钟数
  onCellTap(e) {
    const { date, minutes } = e.currentTarget.dataset
    wx.showToast({
      title: minutes > 0 ? `${date} · 听了 ${minutes} 分` : `${date} · 没听`,
      icon: 'none'
    })
  }
})
