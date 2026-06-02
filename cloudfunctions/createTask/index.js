const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { inputType, fileID, text, url, userIdentity } = event

  const taskId = generateId()

  await db.collection('tasks').add({
    data: {
      _openid: OPENID,
      taskId,
      inputType,            // 'image' | 'text' | 'xhs_link'
      inputFileID: fileID || null,
      inputText: text || null,
      inputUrl: url || null,
      userIdentity: userIdentity || 'general',
      selectedConcepts: [],
      status: 'pending',
      createdAt: db.serverDate()
    }
  })

  return { taskId, openid: OPENID, success: true }
}
