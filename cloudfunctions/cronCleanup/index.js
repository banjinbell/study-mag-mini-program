// cronCleanup：每 5 分钟触发，将超时的 pending 任务标记为 failed
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async () => {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)

  const result = await db.collection('tasks')
    .where({
      status: 'pending',
      createdAt: _.lt(tenMinAgo)
    })
    .update({
      data: {
        status: 'failed',
        error: 'timeout: task stuck in pending for >10 minutes'
      }
    })

  console.log(`cronCleanup: marked ${result.stats?.updated || 0} tasks as failed`)
  return { cleaned: result.stats?.updated || 0 }
}
