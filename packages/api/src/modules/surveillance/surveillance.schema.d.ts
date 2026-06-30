import { z } from 'zod';
/**
 * Disease Surveillance module schemas
 */
export declare const CreateDiseaseAlertSchema: any;
export declare const UpdateDiseaseAlertSchema: any;
export declare const DiseaseAlertResponseSchema: any;
export declare const DiseaseAlertsListSchema: any;
export declare const PaginatedDiseaseAlertsSchema: any;
export type CreateDiseaseAlertInput = z.infer<typeof CreateDiseaseAlertSchema>;
export type UpdateDiseaseAlertInput = z.infer<typeof UpdateDiseaseAlertSchema>;
export type DiseaseAlertResponse = z.infer<typeof DiseaseAlertResponseSchema>;
export type PaginatedDiseaseAlerts = z.infer<typeof PaginatedDiseaseAlertsSchema>;
//# sourceMappingURL=surveillance.schema.d.ts.map