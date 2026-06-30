import { z } from 'zod'
import { UUIDSchema } from '@neng-nom/shared/schemas'

/**
 * Disease Surveillance module schemas
 */

export const CreateDiseaseAlertSchema = z.object({
  diseaseName: z.string().min(1).max(200),
  region: z.string().max(100),
  country: z.string().length(2),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  isConfirmed: z.boolean().default(false),
})

export const UpdateDiseaseAlertSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  isConfirmed: z.boolean().optional(),
})

export const DiseaseAlertResponseSchema = z.object({
  id: UUIDSchema,
  reportedById: UUIDSchema,
  diseaseName: z.string(),
  region: z.string(),
  country: z.string(),
  severity: z.string(),
  isConfirmed: z.boolean(),
  reportedAt: z.string().datetime(),
})

export const DiseaseAlertsListSchema = z.array(DiseaseAlertResponseSchema)

export const PaginatedDiseaseAlertsSchema = z.object({
  alerts: z.array(DiseaseAlertResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

// Type exports
export type CreateDiseaseAlertInput = z.infer<typeof CreateDiseaseAlertSchema>
export type UpdateDiseaseAlertInput = z.infer<typeof UpdateDiseaseAlertSchema>
export type DiseaseAlertResponse = z.infer<typeof DiseaseAlertResponseSchema>
export type PaginatedDiseaseAlerts = z.infer<typeof PaginatedDiseaseAlertsSchema>
