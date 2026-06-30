import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/env.js';
const { combine, timestamp, json, colorize, simple, errors } = winston.format;
// PII sanitizer — GDPR-equivalent for African markets
const sanitizePII = winston.format((info) => {
    const sanitized = { ...info };
    const piiFields = [
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'otpCode',
        'apiKey',
        'apiSecret',
    ];
    for (const field of piiFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    // Mask phone numbers: +237 699123456 → +237 699***456
    if (typeof sanitized['message'] === 'string') {
        sanitized['message'] = sanitized['message'].replace(/(\+\d{3}\s?\d{3})\d{3}(\d{3})/g, '$1***$2');
    }
    return sanitized;
})();
const fileRotate = new DailyRotateFile({
    dirname: 'logs',
    filename: 'neng-nom-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
    maxSize: '20m',
    zippedArchive: true,
    level: 'info',
});
const errorRotate = new DailyRotateFile({
    dirname: 'logs',
    filename: 'errors-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    level: 'error',
});
export const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: combine(errors({ stack: true }), sanitizePII, timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })),
    defaultMeta: {
        service: 'neng-nom-api',
        env: config.NODE_ENV,
    },
    transports: [
        fileRotate,
        errorRotate,
        config.NODE_ENV !== 'production'
            ? new winston.transports.Console({
                format: combine(colorize(), simple()),
            })
            : new winston.transports.Console({ format: json() }),
    ],
});
/**
 * Create a child logger with module context
 * All logs from this logger will include the module name
 */
export function createLogger(module) {
    return logger.child({ module });
}
//# sourceMappingURL=logger.js.map