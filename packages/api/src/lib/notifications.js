import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../../lib/redis.js';
import { getPrismaClient } from '../../lib/prisma.js';
import { createLogger } from '../../lib/logger.js';
const log = createLogger('notifications-worker');
const redis = getRedisClient();
const prisma = getPrismaClient();
/**
 * Notifications Worker
 * Handles push notifications, emails, and SMS
 */
export const notificationsQueue = new Queue('notifications', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
export const notificationsWorker = new Worker('notifications', async (job) => {
    const { type, recipient, subject, content } = job.data;
    log.info('Processing notification', {
        type,
        recipient,
        subject,
        jobId: job.id,
    });
    switch (type) {
        case 'email':
            return await sendEmail(recipient, subject, content);
        case 'sms':
            return await sendSMS(recipient, content);
        case 'push':
            return await sendPushNotification(recipient, subject, content);
        default:
            throw new Error(`Unknown notification type: ${type}`);
    }
}, { connection: redis });
async function sendEmail(email, subject, content) {
    log.info('Sending email', { email, subject });
    // TODO: Integrate with Resend API
    // const response = await resend.emails.send({
    //   from: 'neng-nom@resend.dev',
    //   to: email,
    //   subject,
    //   html: content,
    // })
    return { success: true, messageId: 'email-123' };
}
async function sendSMS(phone, content) {
    log.info('Sending SMS', { phone });
    // TODO: Integrate with Africa's Talking API
    // const response = await afrikasTalking.SMS.send({
    //   recipients: [phone],
    //   message: content,
    // })
    return { success: true, messageId: 'sms-123' };
}
async function sendPushNotification(userId, title, message) {
    log.info('Sending push notification', { userId, title });
    // TODO: Integrate with Firebase Cloud Messaging or OneSignal
    // const response = await fcm.send({
    //   tokens: [userToken],
    //   notification: { title, body: message },
    // })
    return { success: true, messageId: 'push-123' };
}
notificationsWorker.on('completed', (job) => {
    log.info('Notification sent', {
        jobId: job.id,
        type: job.data.type,
    });
});
notificationsWorker.on('failed', (job, error) => {
    log.error('Notification failed', {
        jobId: job?.id,
        type: job?.data.type,
        error: error.message,
    });
});
/**
 * Queue a notification
 */
export async function queueNotification(type, recipient, subject, content) {
    await notificationsQueue.add('send', {
        type,
        recipient,
        subject,
        content,
    });
}
/**
 * Queue reminder notification (health event, lab result, etc.)
 */
export async function queueReminderNotification(userId, title, content) {
    await notificationsQueue.add('reminder', {
        type: 'push',
        recipient: userId,
        subject: title,
        content,
    });
}
export default notificationsWorker;
//# sourceMappingURL=notifications.js.map