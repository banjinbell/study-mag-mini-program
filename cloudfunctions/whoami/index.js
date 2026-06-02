// 轻量函数：返回当前小程序用户的 OPENID
// 给前端建 watch query / list query 的 _openid 条件用
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const { OPENID, APPID } = cloud.getWXContext()
  return { openid: OPENID, appid: APPID }
}
