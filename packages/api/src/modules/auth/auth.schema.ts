import { z } from 'zod'
import {
  EmailSchema,
  PhoneSchema,
  PasswordSchema,
  FullNameSchema,
  UUIDSchema,
  LoginSchema as SharedLoginSchema,
} from '@neng-nom/shared/schemas'

/**
 * Auth module schemas
 * Extends and customizes shared schemas as needed
 */

// Restrict self-registration to FARMER and VET — LAB_TECH/ADMIN require privileged provisioning
export const RegisterSchema = z.object({
  phone: PhoneSchema,
  email: EmailSchema.optional(),
  password: PasswordSchema,
  confirmPassword: z.string(),
  fullName: FullNameSchema,
  role: z.enum(['FARMER', 'VET']),
  country: z.string().length(2).default('CM'),
  region: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const LoginSchema = SharedLoginSchema

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const VerifyOtpSchema = z.object({
  userId: UUIDSchema,
  code: z.string().length(6, 'OTP must be 6 digits'),
})

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: UUIDSchema,
    email: EmailSchema,
    fullName: FullNameSchema,
    role: z.enum(['FARMER', 'VET', 'LAB_TECH', 'ADMIN']),
    isVerified: z.boolean(),
    country: z.string().length(2),
    region: z.string().optional(),
    phone: z.string().optional(),
  }),
})

export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
})

// Type exports for use in services and routes
export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
