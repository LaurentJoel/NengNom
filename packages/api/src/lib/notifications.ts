// import { Queue, Worker } from 'bullmq'
// import { getRedisClient } from './redis.js'
// import { getPrismaClient } from './prisma.js'
// import { createLogger } from './logger.js'

// const log = createLogger('notifications-worker')
// const redis = getRedisClient()
// const prisma = getPrismaClient()

/**
 * Notifications Worker - DISABLED
 * Handles push notifications, emails, and SMS
 */
export const notificationsQueue = null as any
export const notificationsWorker = null as any

/**
 * Queue a notification
 */
export async function queueNotification(
  type: 'email' | 'sms' | 'push',
  recipient: string,
  subject: string,
  content: string
) {
  // Disabled
  return null
}

/**
 * Queue reminder notification (health event, lab result, etc.)
 */
export async function queueReminderNotification(
  userId: string,
  title: string,
  content: string
) {
  // Disabled
  return null
}

export default notificationsWorker
