import { z } from 'zod';
/**
 * Auth module schemas
 * Extends and customizes shared schemas as needed
 */
export declare const RegisterSchema: any;
export declare const LoginSchema: any;
export declare const RefreshTokenSchema: any;
export declare const VerifyOtpSchema: any;
export declare const AuthResponseSchema: any;
export declare const ErrorResponseSchema: any;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
//# sourceMappingURL=auth.schema.d.ts.map