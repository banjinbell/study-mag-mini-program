const api = require('../../utils/api')

const STATUS_LABEL = {
  pending:    '排队',
  processing: '撰稿中',
  done:       '已刊',
  failed:     '脱稿'
}
const STATUS_TAG_CLASS = {
  pending:    'mj-tag--pending',
  processing: 'mj-tag--processing',
  done:       'mj-tag--done',
  failed:     'mj-tag--failed'
}

function padNum(n) { return n < 10 ? '0' + n : String(n) }

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}.${padNum(d.getDate())}`
}

function decorate(task, total, i) {
  const fallbackPreview = task.inputType === 'image'
    ? '[截图] ' + (task.extractedText || '').slice(0, 30)
    : (task.inputText || '').slice(0, 40)
  const displayTitle = task.status === 'done' && task.title
    ? task.title
    : (fallbackPreview || '(撰稿中)')

  return {
    ...task,
    displayTitle,
    epLabel: 'EP.' + padNum(total - i),
    dateLabel: formatDate(task.createdAt),
    statusLabel: STATUS_LABEL[task.status] || task.status,
    statusTagClass: STATUS_TAG_CLASS[task.status] || 'mj-tag--pending'
  }
}

function pad2(n) { return n < 10 ? '0' + n : String(n) }

Page({
  data: {
    tasks: [],
    totalLabel: '00',
    loading: false,
    nowVol: '',
    nowMonth: '',
    nowIssue: ''
  },

  onLoad() {
    const d = new Date()
    this.setData({
      nowVol: 'VOL.' + pad2(d.getFullYear() % 100),
      nowMonth: (d.getMonth() + 1) + '月号',
      nowIssue: d.getFullYear() + ' · 共 0 期'
    })
  },

  onShow() {
    const tab = this.getTabBar && this.getTabBar()
    if (tab && tab.setData) tab.setData({ selected: 1 })
    this.loadTasks()
  },

  async loadTasks() {
    this.setData({ loading: true })
    try {
      const raw = await api.listMyTasks({ limit: 50 })
      const total = raw.length
      const tasks = raw.map((t, i) => decorate(t, total, i))
      const d = new Date()
      this.setData({
        tasks,
        totalLabel: pad2(total),
        nowIssue: d.getFullYear() + ' · 共 ' + total + ' 期'
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async onPullDownRefresh() {
    await this.loadTasks()
    wx.stopPullDownRefresh()
  },

  onTap(e) {
    const taskId = e.currentTarget.dataset.taskId
    wx.navigateTo({ url: `/pages/player/index?taskId=${taskId}` })
  },

  goSubmit() {
    wx.switchTab({ url: '/pages/submit/index' })
  },

  async onLongPress(e) {
    const taskId = e.currentTarget.dataset.taskId
    const epLabel = e.currentTarget.dataset.epLabel || ''
    const title = e.currentTarget.dataset.title || ''

    // 一级菜单
    const action = await new Promise((resolve) => {
      wx.showActionSheet({
        itemList: [`撤刊 / DELETE ${epLabel}`],
        itemColor: '#D8321F',
        success: (res) => resolve(res.tapIndex),
        fail: () => resolve(-1)
      })
    })
    if (action !== 0) return

    // 二次确认 — manga 文案
    const ok = await new Promise((resolve) => {
      wx.showModal({
        title: '撤稿 · OFF DECK',
        content: `「${title.slice(0, 24)}${title.length > 24 ? '…' : ''}」\n音频和原文都会一起清掉，不能恢复。`,
        confirmText: '撤稿',
        confirmColor: '#D8321F',
        cancelText: '保留',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false)
      })
    })
    if (!ok) return

    wx.showLoading({ title: '撤稿中…', mask: true })
    try {
      const res = await api.deleteTask(taskId)
      wx.hideLoading()
      wx.showToast({ title: `已撤刊 · 清 ${res.removedFiles || 0} 文件`, icon: 'none' })
      // 立即从本地列表里删掉这条，再后台刷新一次
      const tasks = this.data.tasks.filter(t => t.taskId !== taskId)
      this.setData({ tasks, totalLabel: String(tasks.length).padStart(2, '0') })
      this.loadTasks()
    } catch (e) {
      wx.hideLoading()
      const msg = e.message || String(e)
      wx.showToast({ title: '撤刊失败: ' + msg.slice(0, 20), icon: 'none' })
      console.error('[delete]', e)
    }
  }
})
