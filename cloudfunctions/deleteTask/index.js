// deleteTask：删除单个 task + 关联文件（音频、原图）
// 安全规则 delete: false，前端无法直删，必须走云函数代理
// 此函数校验 task._openid === 调用者 OPENID 才放行
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { taskId } = event

  if (!taskId) return { success: false, error: 'taskId required' }

  // 1. 查 task 校验所属
  const { data: tasks } = await db.collection('tasks').where({ taskId }).get()
  const task = tasks[0]
  if (!task) return { success: false, error: 'task not found' }
  if (task._openid !== OPENID) return { success: false, error: 'permission denied' }

  // 2. 清理关联文件（音频 + 原图 + xhs/公众号下载的图片）
  const fileIDs = []
  if (task.audioFileID) fileIDs.push(task.audioFileID)
  if (task.inputFileID) fileIDs.push(task.inputFileID)
  if (Array.isArray(task.imageFileIDs)) fileIDs.push(...task.imageFileIDs)

  if (fileIDs.length) {
    try {
      const res = await cloud.deleteFile({ fileList: fileIDs })
      console.log('[deleteTask] cleaned %s files', res.fileList.filter(f => f.status === 0).length)
    } catch (e) {
      console.warn('[deleteTask] deleteFile partial fail:', e.errMsg || e)
      // 文件删失败不阻断 doc 删除——doc 删了文件成为孤儿不严重
    }
  }

  // 3. 删 doc（带 _openid 双重校验）
  const removed = await db.collection('tasks').where({ taskId, _openid: OPENID }).remove()
  return { success: true, taskId, removedDocs: removed.stats.removed, removedFiles: fileIDs.length }
}
