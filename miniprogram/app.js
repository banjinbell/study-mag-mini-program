// app.js
const envConfig = require('./env.config.js')

App({
  onLaunch() {
    this.globalData = {
      // 环境 ID 抽到 env.config.js（gitignored），首次启动须 cp env.config.example.js env.config.js
      env: envConfig.env,
      openid: ''   // 启动后由 whoami 云函数填入；watch/list 查询必带，配合安全规则
    }
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true
    })

    // 拿当前用户 openid 缓存到 globalData
    // watchTask / listMyTasks 必须用它构造 query，否则被安全规则拒绝（-402002）
    wx.cloud.callFunction({ name: 'whoami' })
      .then(({ result }) => {
        if (result && result.openid) {
          this.globalData.openid = result.openid
          console.log('[mj] whoami openid cached')
        }
      })
      .catch(err => console.warn('[mj] whoami failed:', err.errMsg || err))

    // ─────────────────────────────────────────────────────────────
    // Manga Jump 字体加载（jsDelivr @fontsource v5）
    //
    // ⚠ 必须先在小程序后台 → 开发管理 → 开发设置 → 服务器域名
    //   把 `cdn.jsdelivr.net` 加进「downloadFile 合法域名」
    //   否则 wx.loadFontFace 会被微信安全拦截
    //
    // Anton (Latin 杂志 chrome) ≈ 18KB
    // Noto Sans SC 900 简体 ≈ 1MB — 首次加载 1–2 秒走系统兜底，
    //   之后整 session 走 CDN 缓存。如要进一步压缩到 ~250KB
    //   请见 docs/manga-fonts-setup.md 里的子集化方案
    // ─────────────────────────────────────────────────────────────
    const FONT_ANTON =
      'https://cdn.jsdelivr.net/npm/@fontsource/anton@5/files/anton-latin-400-normal.woff2'
    const FONT_NOTO_SC_900 =
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5/files/noto-sans-sc-chinese-simplified-900-normal.woff2'

    wx.loadFontFace({
      family: 'Anton',
      source: `url("${FONT_ANTON}")`,
      desc: { weight: 'normal', style: 'normal' },
      global: true,
      success: () => console.log('[mj-font] Anton loaded'),
      fail: (err) => console.warn('[mj-font] Anton fallback (检查 jsdelivr 白名单):', err.errMsg)
    })

    // ⚠ 关键：CJK 重头字绑定到「专属 family 名」MJ Heading，
    //    不要复用 'Noto Sans SC' — 否则所有声明 Noto Sans SC 的元素
    //    无论指定 weight 400 / 700 / 900 都会被强制渲染为 900，正文全变粗体。
    //    现在：只有 --mj-font-headline / --mj-font-display 引用 'MJ Heading'，
    //    --mj-font-body 走系统 PingFang SC，weight 400 / 700 各自正常。
    wx.loadFontFace({
      family: 'MJ Heading',
      source: `url("${FONT_NOTO_SC_900}")`,
      desc: { weight: 'normal', style: 'normal' },
      global: true,
      success: () => console.log('[mj-font] MJ Heading (Noto SC 900) loaded'),
      fail: (err) => console.warn('[mj-font] MJ Heading fallback (检查 jsdelivr 白名单):', err.errMsg)
    })
  }
})
