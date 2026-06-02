// 云函数调用封装
const db = wx.cloud.database()

// 取当前用户 openid — 用于构造 watch / list 的 _openid 条件
// 安全规则 doc._openid == auth.openid 严格，不带 _openid 的 query 会被拒绝（-402002）
async function getOpenid() {
  const app = getApp()
  if (app && app.globalData && app.globalData.openid) return app.globalData.openid
  // app.js onLaunch 还没拿到时，自己再调一次
  const { result } = await wx.cloud.callFunction({ name: 'whoami' })
  const openid = (result && result.openid) || ''
  if (app && app.globalData) app.globalData.openid = openid
  return openid
}

async function createTask({ inputType, fileID, text, url, userIdentity = 'general' }) {
  const { result } = await wx.cloud.callFunction({
    name: 'createTask',
    data: { inputType, fileID, text, url, userIdentity }
  })
  if (!result || !result.success) throw new Error('createTask failed')
  // createTask 也返回 openid，顺便缓存（一次往返搞定）
  if (result.openid) {
    const app = getApp()
    if (app && app.globalData) app.globalData.openid = result.openid
  }
  return result.taskId
}

// fire-and-forget：触发 processTask（不等返回，云端跑 2-3 分钟）
function startProcessing(taskId) {
  wx.cloud.callFunction({
    name: 'processTask',
    data: { taskId }
  }).catch(e => console.warn('processTask trigger:', e.errMsg || e.message))
}

// 监听单个 task 状态变化
//
// 策略：
//   - 优先用 CloudBase realtime watch（WebSocket，秒级推送）
//   - watch 建连失败时（wsclient timeout / -402002）静默 fallback 到 5s 轮询
//   - 拿到终态 done / failed 就停轮询
//
// 不直接把 watch 错误 onError 给业务——业务只关心拿不拿得到数据
// 同步返回 { close }，调用方不用 await
function watchTask(taskId, { onChange, onError }) {
  let watcher = null
  let pollTimer = null
  let closed = false
  let lastStatus = null
  let openidCache = null

  const isTerminal = (s) => s === 'done' || s === 'failed'

  const fetchOnce = async () => {
    try {
      const _openid = openidCache || await getOpenid()
      openidCache = _openid
      const { data } = await db.collection('tasks').where({ taskId, _openid }).get()
      const doc = data[0]
      if (!doc) return
      if (doc.status !== lastStatus) {
        lastStatus = doc.status
        onChange(doc)
      }
      if (isTerminal(doc.status) && pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    } catch (e) {
      console.warn('[watchTask] poll fetch failed:', e.errMsg || e.message || e)
    }
  }

  const startPolling = () => {
    if (pollTimer || closed) return
    console.log('[watchTask] fallback to 5s polling for', taskId)
    fetchOnce()                                    // 立即拉一次，不等 5s
    pollTimer = setInterval(fetchOnce, 5000)
  }

  getOpenid().then(_openid => {
    if (closed) return
    openidCache = _openid
    // 立即先 fetch 一次，避免 watch 建连前的空白
    fetchOnce()

    watcher = db.collection('tasks').where({ taskId, _openid }).watch({
      onChange: (snapshot) => {
        if (snapshot.docs && snapshot.docs.length > 0) {
          const doc = snapshot.docs[0]
          if (doc.status !== lastStatus) {
            lastStatus = doc.status
            onChange(doc)
          }
          // watch 已工作，停轮询（节流）
          if (isTerminal(doc.status) && pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
          }
        }
      },
      onError: (err) => {
        // 不报错给业务——降级到轮询继续提供数据
        console.warn('[watchTask] WS failed → polling fallback:', err.errMsg || err.message)
        startPolling()
      }
    })
  }).catch(err => {
    console.error('[watchTask] openid error:', err)
    // openid 拿不到时无法构造 query，只能 onError
    if (onError) onError(err)
  })

  return {
    close() {
      closed = true
      if (watcher) try { watcher.close() } catch (e) {}
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    }
  }
}

// 取当前用户的 task 列表（按时间倒序）
async function listMyTasks({ limit = 50 } = {}) {
  const _openid = await getOpenid()
  const { data } = await db.collection('tasks')
    .where({ _openid })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  return data
}

// fileID → 临时 https URL
async function fileIdToUrl(fileID) {
  const { fileList } = await wx.cloud.getTempFileURL({ fileList: [fileID] })
  return fileList[0] && fileList[0].tempFileURL
}

// ──────────────────────────────────────────────────
//  Profile / 約稿单
// ──────────────────────────────────────────────────
async function getProfile() {
  const { result } = await wx.cloud.callFunction({ name: 'getProfile' })
  return result || { profile: null, empty: true }
}

async function saveProfile(fields) {
  const { result } = await wx.cloud.callFunction({
    name: 'saveProfile',
    data: fields
  })
  if (!result || !result.success) throw new Error((result && result.error) || 'save failed')
  return result
}

async function getReadingStats() {
  const { result } = await wx.cloud.callFunction({ name: 'getReadingStats' })
  return result || { success: false }
}

// 心跳：上报本次 deltaSec 收听时长
function recordListening(taskId, deltaSec) {
  if (!taskId || !deltaSec || deltaSec < 1) return
  return wx.cloud.callFunction({
    name: 'recordListening',
    data: { taskId, deltaSec: Math.round(deltaSec) }
  }).catch(e => console.warn('[recordListening]', e.errMsg || e.message))
}

// 删除单期（撤刊）：删 doc + 关联文件，仅自己 task 可删
async function deleteTask(taskId) {
  const { result } = await wx.cloud.callFunction({
    name: 'deleteTask',
    data: { taskId }
  })
  if (!result || !result.success) {
    throw new Error((result && result.error) || 'delete failed')
  }
  return result
}

module.exports = {
  createTask,
  startProcessing,
  watchTask,
  listMyTasks,
  fileIdToUrl,
  deleteTask,
  // profile + stats
  getProfile,
  saveProfile,
  getReadingStats,
  recordListening,
  db
}
