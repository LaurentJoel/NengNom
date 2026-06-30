/**
 * Shared Zod schemas used by both API and frontend
 * Enables type-safe communication and validation
 */
import { z } from 'zod';
export declare const UUIDSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const PhoneSchema: z.ZodString;
export declare const PasswordSchema: z.ZodString;
export declare const FullNameSchema: z.ZodString;
export declare const RegisterSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodEnum<["FARMER", "VET", "LAB_TECH"]>;
    country: z.ZodDefault<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    role: "FARMER" | "VET" | "LAB_TECH";
    country: string;
    phone?: string | undefined;
    region?: string | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    role: "FARMER" | "VET" | "LAB_TECH";
    phone?: string | undefined;
    country?: string | undefined;
    region?: string | undefined;
}>, {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    role: "FARMER" | "VET" | "LAB_TECH";
    country: string;
    phone?: string | undefined;
    region?: string | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    role: "FARMER" | "VET" | "LAB_TECH";
    phone?: string | undefined;
    country?: string | undefined;
    region?: string | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const AuthResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        fullName: z.ZodString;
        role: z.ZodEnum<["FARMER", "VET", "LAB_TECH", "ADMIN"]>;
        isVerified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        email: string;
        fullName: string;
        role: "FARMER" | "VET" | "LAB_TECH" | "ADMIN";
        id: string;
        isVerified: boolean;
    }, {
        email: string;
        fullName: string;
        role: "FARMER" | "VET" | "LAB_TECH" | "ADMIN";
        id: string;
        isVerified: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    refreshToken: string;
    user: {
        email: string;
        fullName: string;
        role: "FARMER" | "VET" | "LAB_TECH" | "ADMIN";
        id: string;
        isVerified: boolean;
    };
}, {
    accessToken: string;
    refreshToken: string;
    user: {
        email: string;
        fullName: string;
        role: "FARMER" | "VET" | "LAB_TECH" | "ADMIN";
        id: string;
        isVerified: boolean;
    };
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
//# sourceMappingURL=index.d.ts.map