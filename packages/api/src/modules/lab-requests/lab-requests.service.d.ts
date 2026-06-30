import { PrismaClient } from '@prisma/client';
import type { CreateLabRequestInput, UpdateLabRequestInput } from './lab-requests.schema.js';
/**
 * LabRequestsService — mobile lab test requests
 */
export declare class LabRequestsService {
    private prisma;
    constructor(prisma: PrismaClient);
    createRequest(farmerId: string, input: CreateLabRequestInput): Promise<any>;
    getRequest(requestId: string): Promise<any>;
    listRequests(farmerId: string, limit?: number, offset?: number): Promise<{
        requests: any;
        total: any;
    }>;
    listRequestsByStatus(status: string, limit?: number, offset?: number): Promise<{
        requests: any;
        total: any;
    }>;
    listPendingRequests(limit?: number): Promise<any>;
    updateRequest(requestId: string, input: UpdateLabRequestInput): Promise<any>;
    assignVetReview(requestId: string, vetId: string, review: string): Promise<any>;
    listResultsReady(limit?: number): Promise<any>;
}
//# sourceMappingURL=lab-requests.service.d.ts.map