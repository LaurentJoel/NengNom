/**
 * Shared constants for validation used by both API and frontend
 */

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
} as const
