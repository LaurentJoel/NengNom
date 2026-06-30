import { z } from 'zod';
import { UUIDSchema, EmailSchema, PhoneSchema, FullNameSchema } from '@neng-nom/shared/schemas';
/**
 * Users module schemas
 */
export const GetUserSchema = z.object({
    id: UUIDSchema,
});
export const UpdateProfileSchema = z.object({
    fullName: FullNameSchema.optional(),
    phone: PhoneSchema.optional(),
    region: z.string().max(100).optional(),
});
export const FarmerProfileSchema = z.object({
    farmName: z.string().max(100).optional(),
    farmType: z.string().max(50).optional(),
    animalCount: z.number().int().min(0).optional(),
    gpsLocation: z.string().regex(/^-?\d+\.\d+,-?\d+\.\d+$/).optional(),
});
export const UpdateFarmerProfileSchema = z.object({
    farmName: z.string().max(100).optional(),
    farmType: z.string().max(50).optional(),
    animalCount: z.number().int().min(0).optional(),
    gpsLocation: z.string().regex(/^-?\d+\.\d+,-?\d+\.\d+$/).optional(),
});
export const VetProfileSchema = z.object({
    licenseNumber: z.string().min(1).max(50).optional(),
    specialization: z.string().max(100).optional(),
    hourlyRate: z.number().min(0).optional(),
    isAvailable: z.boolean().optional(),
});
export const UpdateVetProfileSchema = z.object({
    specialization: z.string().max(100).optional(),
    hourlyRate: z.number().min(0).optional(),
    isAvailable: z.boolean().optional(),
});
export const UserResponseSchema = z.object({
    id: UUIDSchema,
    email: EmailSchema,
    fullName: FullNameSchema,
    role: z.enum(['FARMER', 'VET', 'LAB_TECH', 'ADMIN']),
    country: z.string().length(2),
    region: z.string().optional(),
    phone: PhoneSchema.optional(),
    isVerified: z.boolean(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const UserWithProfileSchema = UserResponseSchema.extend({
    farmerProfile: FarmerProfileSchema.optional(),
    vetProfile: VetProfileSchema.optional(),
});
//# sourceMappingURL=users.schema.js.map