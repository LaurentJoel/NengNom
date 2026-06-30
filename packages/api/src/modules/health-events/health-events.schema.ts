import { z } from 'zod'
import { UUIDSchema } from '@neng-nom/shared/schemas'

/**
 * Health Events module schemas
 */

export const CreateHealthEventSchema = z.object({
  eventType: z.enum(['vaccination', 'deworming', 'treatment', 'isolation']),
  productUsed: z.string().max(100).optional(),
  animalGroup: z.string().max(100).optional(),
  eventDate: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
})

export const UpdateHealthEventSchema = z.object({
  productUsed: z.string().max(100).optional(),
  animalGroup: z.string().max(100).optional(),
  nextDueDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
})

export const HealthEventResponseSchema = z.object({
  id: UUIDSchema,
  farmerId: UUIDSchema,
  eventType: z.string(),
  productUsed: z.string().optional(),
  animalGroup: z.string().optional(),
  eventDate: z.string(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
})

export const HealthEventsListSchema = z.array(HealthEventResponseSchema)

export const PaginatedHealthEventsSchema = z.object({
  events: z.array(HealthEventResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

// Type exports
export type CreateHealthEventInput = z.infer<typeof CreateHealthEventSchema>
export type UpdateHealthEventInput = z.infer<typeof UpdateHealthEventSchema>
export type HealthEventResponse = z.infer<typeof HealthEventResponseSchema>
export type PaginatedHealthEvents = z.infer<typeof PaginatedHealthEventsSchema>
