import { z } from 'zod';
/**
 * Farm Records module schemas
 */
export declare const CreateFarmRecordSchema: any;
export declare const UpdateFarmRecordSchema: any;
export declare const FarmRecordResponseSchema: any;
export declare const FarmRecordsListSchema: any;
export declare const PaginatedFarmRecordsSchema: any;
export type CreateFarmRecordInput = z.infer<typeof CreateFarmRecordSchema>;
export type UpdateFarmRecordInput = z.infer<typeof UpdateFarmRecordSchema>;
export type FarmRecordResponse = z.infer<typeof FarmRecordResponseSchema>;
export type PaginatedFarmRecords = z.infer<typeof PaginatedFarmRecordsSchema>;
//# sourceMappingURL=farm-records.schema.d.ts.map