import { z } from 'zod';
/**
 * Lab Requests module schemas
 */
export declare const CreateLabRequestSchema: any;
export declare const UpdateLabRequestSchema: any;
export declare const LabRequestResponseSchema: any;
export declare const LabRequestsListSchema: any;
export declare const PaginatedLabRequestsSchema: any;
export type CreateLabRequestInput = z.infer<typeof CreateLabRequestSchema>;
export type UpdateLabRequestInput = z.infer<typeof UpdateLabRequestSchema>;
export type LabRequestResponse = z.infer<typeof LabRequestResponseSchema>;
export type PaginatedLabRequests = z.infer<typeof PaginatedLabRequestsSchema>;
//# sourceMappingURL=lab-requests.schema.d.ts.map