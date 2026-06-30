import { z } from 'zod'
import { UUIDSchema } from '@neng-nom/shared/schemas'

/**
 * Farm Records module schemas
 */

export const CreateFarmRecordSchema = z.object({
  recordDate: z.coerce.date(),
  animalCount: z.number().int().min(0),
  mortalityCount: z.number().int().min(0).default(0),
  feedConsumedKg: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

export const UpdateFarmRecordSchema = z.object({
  animalCount: z.number().int().min(0).optional(),
  mortalityCount: z.number().int().min(0).optional(),
  feedConsumedKg: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

export const FarmRecordResponseSchema = z.object({
  id: UUIDSchema,
  farmerId: UUIDSchema,
  recordDate: z.string(),
  animalCount: z.number().int(),
  mortalityCount: z.number().int(),
  feedConsumedKg: z.number().optional(),
  expenses: z.number().optional(),
  revenue: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
})

export const FarmRecordsListSchema = z.array(FarmRecordResponseSchema)

export const PaginatedFarmRecordsSchema = z.object({
  records: z.array(FarmRecordResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

// Type exports
export type CreateFarmRecordInput = z.infer<typeof CreateFarmRecordSchema>
export type UpdateFarmRecordInput = z.infer<typeof UpdateFarmRecordSchema>
export type FarmRecordResponse = z.infer<typeof FarmRecordResponseSchema>
export type PaginatedFarmRecords = z.infer<typeof PaginatedFarmRecordsSchema>
