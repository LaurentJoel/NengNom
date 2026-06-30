import { z } from 'zod';
/**
 * Health Events module schemas
 */
export declare const CreateHealthEventSchema: any;
export declare const UpdateHealthEventSchema: any;
export declare const HealthEventResponseSchema: any;
export declare const HealthEventsListSchema: any;
export declare const PaginatedHealthEventsSchema: any;
export type CreateHealthEventInput = z.infer<typeof CreateHealthEventSchema>;
export type UpdateHealthEventInput = z.infer<typeof UpdateHealthEventSchema>;
export type HealthEventResponse = z.infer<typeof HealthEventResponseSchema>;
export type PaginatedHealthEvents = z.infer<typeof PaginatedHealthEventsSchema>;
//# sourceMappingURL=health-events.schema.d.ts.map