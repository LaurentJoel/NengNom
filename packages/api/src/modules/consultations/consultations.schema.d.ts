import { z } from 'zod';
/**
 * Consultations module schemas
 */
export declare const CreateConsultationSchema: any;
export declare const UpdateConsultationSchema: any;
export declare const CreateMessageSchema: any;
export declare const ConsultationResponseSchema: any;
export declare const MessageResponseSchema: any;
export type CreateConsultationInput = z.infer<typeof CreateConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof UpdateConsultationSchema>;
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type ConsultationResponse = z.infer<typeof ConsultationResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
//# sourceMappingURL=consultations.schema.d.ts.map