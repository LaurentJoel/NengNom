import { z } from 'zod';
import { UUIDSchema } from '@neng-nom/shared/schemas';
/**
 * Consultations module schemas
 */
export const CreateConsultationSchema = z.object({
    vetId: UUIDSchema.optional(),
    type: z.enum(['CHAT', 'VOICE', 'VIDEO', 'EMERGENCY']),
    symptomsDescription: z.string().max(5000).optional(),
    mediaUrls: z.array(z.string().url()).default([]),
});
export const UpdateConsultationSchema = z.object({
    status: z.enum(['PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED']).optional(),
    prescription: z.string().max(10000).optional(),
    fee: z.number().min(0).optional(),
});
export const CreateMessageSchema = z.object({
    content: z.string().max(10000).optional(),
    mediaUrl: z.string().url().optional(),
    messageType: z.string().default('text'),
});
export const ConsultationResponseSchema = z.object({
    id: UUIDSchema,
    farmerId: UUIDSchema,
    vetId: UUIDSchema.optional(),
    type: z.enum(['CHAT', 'VOICE', 'VIDEO', 'EMERGENCY']),
    status: z.enum(['PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED']),
    symptomsDescription: z.string().optional(),
    mediaUrls: z.array(z.string().url()),
    prescription: z.string().optional(),
    fee: z.number().optional(),
    startedAt: z.string().datetime().optional(),
    endedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const MessageResponseSchema = z.object({
    id: UUIDSchema,
    consultationId: UUIDSchema,
    senderId: UUIDSchema,
    content: z.string().optional(),
    mediaUrl: z.string().url().optional(),
    messageType: z.string(),
    sentAt: z.string().datetime(),
});
//# sourceMappingURL=consultations.schema.js.map