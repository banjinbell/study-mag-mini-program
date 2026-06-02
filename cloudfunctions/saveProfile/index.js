// saveProfile：保存档案（manga 风格的「約稿单」）
// upsert 逻辑：一个 _openid 一条 doc（手动 query → add/update）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 允许写入的字段白名单 — 防止用户塞乱七八糟字段
const ALLOWED_FIELDS = ['identity', 'level', 'tones', 'topics']

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { success: false, error: 'no openid' }

  // 取白名单字段
  const data = {}
  for (const k of ALLOWED_FIELDS) {
    if (event[k] !== undefined) data[k] = event[k]
  }
  data._openid = OPENID
  data.updatedAt = db.serverDate()

  // upsert
  const { data: existing } = await db.collection('userProfiles').where({ _openid: OPENID }).get()
  let docId
  if (existing.length === 0) {
    data.createdAt = db.serverDate()
    const addRes = await db.collection('userProfiles').add({ data })
    docId = addRes._id
  } else {
    docId = existing[0]._id
    await db.collection('userProfiles').doc(docId).update({ data })
  }

  return { success: true, docId }
}
