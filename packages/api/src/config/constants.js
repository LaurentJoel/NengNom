/**
 * Application-wide constants and timeouts
 * Tuned for African network conditions (3G/4G with occasional latency)
 */
export const TIMEOUTS = {
    DEFAULT_REQUEST: 15_000, // 15s — generous for 3G/4G
    FILE_UPLOAD: 90_000, // 90s — images/videos on slow connection
    GROQ_COMPLETION: 45_000, // 45s — LLM can be slow
    SOCKET_CONNECT: 10_000, // 10s — real-time connection
    GPS_LOOKUP: 20_000, // 20s — GPS resolve in rural areas
    SMS_OTP: 30_000, // 30s — SMS delivery delay in CM/CG
    DB_QUERY_WARN: 1_000, // Log warning if query > 1s
    DB_QUERY_TIMEOUT: 10_000, // Kill query if > 10s
};
export const BCRYPT_ROUNDS = 12;
export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0,
};
export const RATE_LIMITS = {
    // Per IP
    DEFAULT_MAX: 100,
    DEFAULT_TIMEFRAME: 15 * 60 * 1000, // 15 minutes
    // Auth endpoints (stricter)
    AUTH_LOGIN_MAX: 5,
    AUTH_LOGIN_TIMEFRAME: 15 * 60 * 1000,
    AUTH_REGISTER_MAX: 3,
    AUTH_REGISTER_TIMEFRAME: 60 * 60 * 1000, // 1 hour
    // File uploads (more permissive)
    UPLOAD_MAX: 50,
    UPLOAD_TIMEFRAME: 60 * 60 * 1000, // 1 hour
};
export const CIRCUIT_BREAKER = {
    TIMEOUT: 15_000,
    ERROR_THRESHOLD_PERCENTAGE: 50,
    RESET_TIMEOUT: 30_000,
    VOLUME_THRESHOLD: 5,
};
export const REDIS = {
    KEY_REFRESH_TOKEN_PREFIX: 'refresh_token:',
    KEY_OTP_PREFIX: 'otp:',
    KEY_IDEMPOTENCY_PREFIX: 'idempotency:',
    KEY_RATE_LIMIT_PREFIX: 'rate_limit:',
    IDEMPOTENCY_TTL: 24 * 60 * 60, // 24 hours
    REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60, // 7 days
    OTP_TTL: 10 * 60, // 10 minutes
};
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    FULLNAME_MIN_LENGTH: 2,
    FULLNAME_MAX_LENGTH: 100,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    OTP_LENGTH: 6,
    FARM_NAME_MAX_LENGTH: 100,
};
export const COUNTRIES = {
    CM: 'Cameroon',
    CG: 'Congo Brazzaville',
    CD: 'Congo Kinshasa',
    GA: 'Gabon',
};
export const SUPPORTED_COUNTRIES = Object.keys(COUNTRIES);
export const AFRICAN_TIMEZONES = {
    CM: 'Africa/Douala',
    CG: 'Africa/Brazzaville',
    CD: 'Africa/Kinshasa',
    GA: 'Africa/Libreville',
};
//# sourceMappingURL=constants.js.map