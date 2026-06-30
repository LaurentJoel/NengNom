import { PrismaClient } from '@prisma/client';
import type { CreateConsultationInput, UpdateConsultationInput, CreateMessageInput } from './consultations.schema.js';
/**
 * ConsultationsService — consultation and messaging
 */
export declare class ConsultationsService {
    private prisma;
    constructor(prisma: PrismaClient);
    createConsultation(farmerId: string, input: CreateConsultationInput): Promise<any>;
    getConsultation(consultationId: string): Promise<any>;
    listConsultations(farmerId: string, limit?: number, offset?: number): Promise<{
        consultations: any;
        total: any;
    }>;
    listVetConsultations(vetId: string, limit?: number, offset?: number): Promise<{
        consultations: any;
        total: any;
    }>;
    updateConsultation(consultationId: string, userId: string, input: UpdateConsultationInput): Promise<any>;
    addMessage(consultationId: string, senderId: string, input: CreateMessageInput): Promise<any>;
    getMessages(consultationId: string, limit?: number, offset?: number): Promise<{
        messages: any;
        total: any;
    }>;
}
//# sourceMappingURL=consultations.service.d.ts.map