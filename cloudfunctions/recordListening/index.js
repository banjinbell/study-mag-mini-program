// recordListening：写一条心跳/会话收听记录
// 前端 player 每 30s ping + onPause/onEnded 时 flush
// 设计：同 _openid + date + taskId 一条 doc，存累计 durationSec，upsert
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function todayDate() {
  const d = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { taskId, deltaSec } = event

  if (!OPENID) return { success: false, error: 'no openid' }
  if (!taskId) return { success: false, error: 'taskId required' }
  if (typeof deltaSec !== 'number' || deltaSec < 0 || deltaSec > 3600) {
    return { success: false, error: 'invalid deltaSec' }
  }

  const date = todayDate()

  // upsert：where openid+date+taskId 找现有行 → $inc 累加；否则新增
  const { data: existing } = await db.collection('listenLog')
    .where({ _openid: OPENID, date, taskId })
    .get()

  if (existing.length) {
    const newTotal = (existing[0].durationSec || 0) + Math.round(deltaSec)
    await db.collection('listenLog').doc(existing[0]._id).update({
      data: { durationSec: newTotal, updatedAt: db.serverDate() }
    })
    return { success: true, durationSec: newTotal, mode: 'updated' }
  } else {
    await db.collection('listenLog').add({
      data: {
        _openid: OPENID,
        date,
        taskId,
        durationSec: Math.round(deltaSec),
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
    return { success: true, durationSec: Math.round(deltaSec), mode: 'created' }
  }
}
