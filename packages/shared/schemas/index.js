/**
 * Shared Zod schemas used by both API and frontend
 * Enables type-safe communication and validation
 */
import { z } from 'zod';
import { VALIDATION } from '../api/src/config/constants.js';
// Common schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email().max(VALIDATION.EMAIL_MAX_LENGTH);
export const PhoneSchema = z
    .string()
    .regex(/^\+\d{10,15}$/, 'Phone must be in format: +237XXXXXXXXX');
export const PasswordSchema = z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, 'Minimum 8 characters')
    .max(VALIDATION.PASSWORD_MAX_LENGTH)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit');
export const FullNameSchema = z
    .string()
    .min(VALIDATION.FULLNAME_MIN_LENGTH)
    .max(VALIDATION.FULLNAME_MAX_LENGTH);
// Auth schemas
export const RegisterSchema = z
    .object({
    email: EmailSchema,
    phone: PhoneSchema.optional(),
    password: PasswordSchema,
    confirmPassword: z.string(),
    fullName: FullNameSchema,
    role: z.enum(['FARMER', 'VET', 'LAB_TECH']),
    country: z.string().length(2).default('CM'),
    region: z.string().optional(),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1),
});
export const AuthResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
        id: UUIDSchema,
        email: EmailSchema,
        fullName: FullNameSchema,
        role: z.enum(['FARMER', 'VET', 'LAB_TECH', 'ADMIN']),
        isVerified: z.boolean(),
    }),
});
//# sourceMappingURL=index.js.map