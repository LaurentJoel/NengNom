/**
 * Application-wide constants and timeouts
 * Tuned for African network conditions (3G/4G with occasional latency)
 */
export declare const TIMEOUTS: {
    readonly DEFAULT_REQUEST: 15000;
    readonly FILE_UPLOAD: 90000;
    readonly GROQ_COMPLETION: 45000;
    readonly SOCKET_CONNECT: 10000;
    readonly GPS_LOOKUP: 20000;
    readonly SMS_OTP: 30000;
    readonly DB_QUERY_WARN: 1000;
    readonly DB_QUERY_TIMEOUT: 10000;
};
export declare const BCRYPT_ROUNDS = 12;
export declare const PAGINATION: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly DEFAULT_OFFSET: 0;
};
export declare const RATE_LIMITS: {
    readonly DEFAULT_MAX: 100;
    readonly DEFAULT_TIMEFRAME: number;
    readonly AUTH_LOGIN_MAX: 5;
    readonly AUTH_LOGIN_TIMEFRAME: number;
    readonly AUTH_REGISTER_MAX: 3;
    readonly AUTH_REGISTER_TIMEFRAME: number;
    readonly UPLOAD_MAX: 50;
    readonly UPLOAD_TIMEFRAME: number;
};
export declare const CIRCUIT_BREAKER: {
    readonly TIMEOUT: 15000;
    readonly ERROR_THRESHOLD_PERCENTAGE: 50;
    readonly RESET_TIMEOUT: 30000;
    readonly VOLUME_THRESHOLD: 5;
};
export declare const REDIS: {
    readonly KEY_REFRESH_TOKEN_PREFIX: "refresh_token:";
    readonly KEY_OTP_PREFIX: "otp:";
    readonly KEY_IDEMPOTENCY_PREFIX: "idempotency:";
    readonly KEY_RATE_LIMIT_PREFIX: "rate_limit:";
    readonly IDEMPOTENCY_TTL: number;
    readonly REFRESH_TOKEN_TTL: number;
    readonly OTP_TTL: number;
};
export declare const VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_MAX_LENGTH: 100;
    readonly EMAIL_MAX_LENGTH: 255;
    readonly FULLNAME_MIN_LENGTH: 2;
    readonly FULLNAME_MAX_LENGTH: 100;
    readonly PHONE_MIN_LENGTH: 10;
    readonly PHONE_MAX_LENGTH: 15;
    readonly OTP_LENGTH: 6;
    readonly FARM_NAME_MAX_LENGTH: 100;
};
export declare const COUNTRIES: {
    readonly CM: "Cameroon";
    readonly CG: "Congo Brazzaville";
    readonly CD: "Congo Kinshasa";
    readonly GA: "Gabon";
};
export declare const SUPPORTED_COUNTRIES: string[];
export declare const AFRICAN_TIMEZONES: {
    readonly CM: "Africa/Douala";
    readonly CG: "Africa/Brazzaville";
    readonly CD: "Africa/Kinshasa";
    readonly GA: "Africa/Libreville";
};
//# sourceMappingURL=constants.d.ts.map