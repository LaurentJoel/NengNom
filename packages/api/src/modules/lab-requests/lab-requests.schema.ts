import { z } from 'zod'
import { UUIDSchema } from '@neng-nom/shared/schemas'

/**
 * Lab Requests module schemas
 */

export const CreateLabRequestSchema = z.object({
  gpsLocation: z.string()
    .regex(/^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$/, 'GPS location must be decimal coordinates, e.g. 3.8480,11.5021')
    .max(60),
  testType: z.enum([
    'DISEASE_DIAGNOSIS',
    'PARASITOLOGY',
    'HEMATOLOGY',
    'BACTERIOLOGY',
    'WATER_QUALITY',
    'BIOSECURITY_AUDIT',
    'FEED_QUALITY',
  ]),
  instructions: z.string().max(5000).optional(),
})

export const UpdateLabRequestSchema = z.object({
  status: z.enum([
    'REQUESTED',
    'SCHEDULED',
    'TECHNICIAN_DISPATCHED',
    'SAMPLES_COLLECTED',
    'ANALYZING',
    'RESULTS_READY',
    'DELIVERED',
  ]).optional(),
  priceQuoted: z.number().min(0).optional(),
  scheduledAt: z.coerce.date().optional(),
  resultUrl: z.string().url().optional(),
  vetReview: z.string().max(10000).optional(),
})

export const LabRequestResponseSchema = z.object({
  id: UUIDSchema,
  farmerId: UUIDSchema,
  vetId: UUIDSchema.optional(),
  technicianId: UUIDSchema.optional(),
  status: z.string(),
  gpsLocation: z.string(),
  testType: z.string(),
  priceQuoted: z.number().optional(),
  scheduledAt: z.string().datetime().optional(),
  resultUrl: z.string().url().optional(),
  vetReview: z.string().optional(),
  instructions: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const LabRequestsListSchema = z.array(LabRequestResponseSchema)

export const PaginatedLabRequestsSchema = z.object({
  requests: z.array(LabRequestResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

// Type exports
export type CreateLabRequestInput = z.infer<typeof CreateLabRequestSchema>
export type UpdateLabRequestInput = z.infer<typeof UpdateLabRequestSchema>
export type LabRequestResponse = z.infer<typeof LabRequestResponseSchema>
export type PaginatedLabRequests = z.infer<typeof PaginatedLabRequestsSchema>
