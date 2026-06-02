const api = require('../../utils/api')

function generateWave(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const h = 12 + Math.abs(Math.sin(i * 0.6) + Math.cos(i * 0.35)) * 26
    out.push(Math.round(h))
  }
  return out
}

Page({
  data: {
    mode: 'text',
    text: '',
    imagePath: '',
    linkText: '',
    submitting: false,
    ctaDisabled: true,
    // success sheet state
    showSuccessSheet: false,
    lastTaskId: '',
    successWave: generateWave(36)
  },

  noop() {},

  goPlayer() {
    const taskId = this.data.lastTaskId
    if (!taskId) return
    this.setData({ showSuccessSheet: false })
    wx.navigateTo({ url: `/pages/player/index?taskId=${taskId}` })
  },

  dismissSheet() {
    this.setData({ showSuccessSheet: false, lastTaskId: '' })
  },

  onShow() {
    // 主动同步 custom tab bar 的选中态
    const tab = this.getTabBar && this.getTabBar()
    if (tab && tab.setData) tab.setData({ selected: 0 })
    this._recomputeDisabled()
  },

  onModeTap(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode }, () => this._recomputeDisabled())
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value }, () => this._recomputeDisabled())
  },

  onLinkInput(e) {
    this.setData({ linkText: e.detail.value }, () => this._recomputeDisabled())
  },

  _recomputeDisabled() {
    const { mode, text, imagePath, linkText, submitting } = this.data
    let disabled = submitting
    if (mode === 'text') disabled = disabled || text.trim().length < 10
    if (mode === 'image') disabled = disabled || !imagePath
    if (mode === 'link') disabled = disabled || !linkText.trim()
    this.setData({ ctaDisabled: disabled })
  },

  chooseFromAlbum() { this._chooseMedia(['album']) },
  chooseFromCamera() { this._chooseMedia(['camera']) },

  async _chooseMedia(sourceType) {
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType
      })
      const tempFile = tempFiles[0]
      let filePath = tempFile.tempFilePath
      if (tempFile.size > 5 * 1024 * 1024) {
        const c = await wx.compressImage({ src: filePath, quality: 75 })
        filePath = c.tempFilePath
      }
      this.setData({ imagePath: filePath }, () => this._recomputeDisabled())
    } catch (e) {
      console.warn('chooseMedia cancelled:', e)
    }
  },

  async onSubmit() {
    if (this.data.ctaDisabled) return
    const { mode, text, imagePath, linkText } = this.data

    if (mode === 'text' && text.trim().length < 10) {
      wx.showToast({ title: '至少 10 个字', icon: 'none' })
      return
    }
    if (mode === 'image' && !imagePath) {
      wx.showToast({ title: '请先选张图', icon: 'none' })
      return
    }
    if (mode === 'link' && !/https?:\/\/[^\s]+/.test(linkText)) {
      wx.showToast({ title: '请粘贴含链接的分享内容', icon: 'none' })
      return
    }

    this.setData({ submitting: true }, () => this._recomputeDisabled())
    wx.showLoading({ title: '撰稿中…', mask: true })

    try {
      let fileID = null
      if (mode === 'image') {
        wx.showLoading({ title: '上传图片…', mask: true })
        const cloudPath = `inputs/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
        const upload = await wx.cloud.uploadFile({ cloudPath, filePath: imagePath })
        fileID = upload.fileID
      }

      wx.showLoading({ title: '创建任务…', mask: true })
      const taskId = await api.createTask({
        inputType: mode,
        fileID,
        text: mode === 'text' ? text : null,
        url: mode === 'link' ? linkText : null
      })

      api.startProcessing(taskId)

      wx.hideLoading()

      // 清空输入 + 弹起 manga 反馈层（不自动跳转，让用户选）
      this.setData({
        text: '',
        imagePath: '',
        linkText: '',
        lastTaskId: taskId,
        showSuccessSheet: true,
        successWave: generateWave(36)  // 每次重新生成，下次弹起有微差
      })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败: ' + (e.message || e), icon: 'none', duration: 3000 })
      console.error(e)
    } finally {
      this.setData({ submitting: false }, () => this._recomputeDisabled())
    }
  }
})
