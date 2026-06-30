/**
 * Notifications Worker
 * Handles push notifications, emails, and SMS
 */
export declare const notificationsQueue: any;
export declare const notificationsWorker: any;
/**
 * Queue a notification
 */
export declare function queueNotification(type: 'email' | 'sms' | 'push', recipient: string, subject: string, content: string): Promise<void>;
/**
 * Queue reminder notification (health event, lab result, etc.)
 */
export declare function queueReminderNotification(userId: string, title: string, content: string): Promise<void>;
export default notificationsWorker;
//# sourceMappingURL=notifications.d.ts.map