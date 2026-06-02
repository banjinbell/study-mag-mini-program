// getProfile：返回当前用户的 userProfile（含字段 + portraitFileID）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const { data } = await db.collection('userProfiles').where({ _openid: OPENID }).get()
  if (!data.length) {
    return {
      profile: null,
      empty: true
    }
  }
  return { profile: data[0], empty: false }
}
