import { createLogger } from '../../lib/logger.js';
import { NotFoundError } from '../../lib/errors.js';
const log = createLogger('lab-requests-service');
/**
 * LabRequestsService — mobile lab test requests
 */
export class LabRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRequest(farmerId, input) {
        const request = await this.prisma.labRequest.create({
            data: {
                farmerId,
                gpsLocation: input.gpsLocation,
                testType: input.testType,
                instructions: input.instructions,
                status: 'REQUESTED',
            },
        });
        log.info('Lab request created', {
            requestId: request.id,
            farmerId,
            testType: input.testType,
            gpsLocation: input.gpsLocation,
        });
        return request;
    }
    async getRequest(requestId) {
        const request = await this.prisma.labRequest.findUnique({
            where: { id: requestId },
            include: {
                farmer: true,
                vet: true,
            },
        });
        if (!request) {
            throw new NotFoundError('Lab request', requestId);
        }
        return request;
    }
    async listRequests(farmerId, limit = 20, offset = 0) {
        const [requests, total] = await Promise.all([
            this.prisma.labRequest.findMany({
                where: { farmerId },
                include: {
                    farmer: true,
                    vet: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.labRequest.count({ where: { farmerId } }),
        ]);
        return { requests, total };
    }
    async listRequestsByStatus(status, limit = 50, offset = 0) {
        const [requests, total] = await Promise.all([
            this.prisma.labRequest.findMany({
                where: { status },
                include: {
                    farmer: true,
                    vet: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.labRequest.count({ where: { status } }),
        ]);
        return { requests, total };
    }
    async listPendingRequests(limit = 50) {
        const requests = await this.prisma.labRequest.findMany({
            where: {
                status: 'REQUESTED',
            },
            include: {
                farmer: true,
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
        return requests;
    }
    async updateRequest(requestId, input) {
        const request = await this.getRequest(requestId);
        const updated = await this.prisma.labRequest.update({
            where: { id: requestId },
            data: {
                status: input.status,
                priceQuoted: input.priceQuoted,
                scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
                resultUrl: input.resultUrl,
                vetReview: input.vetReview,
            },
            include: {
                farmer: true,
                vet: true,
            },
        });
        log.info('Lab request updated', {
            requestId,
            status: input.status,
        });
        return updated;
    }
    async assignVetReview(requestId, vetId, review) {
        const request = await this.getRequest(requestId);
        const updated = await this.prisma.labRequest.update({
            where: { id: requestId },
            data: {
                vetId,
                vetReview: review,
                status: 'RESULTS_READY',
            },
            include: {
                farmer: true,
                vet: true,
            },
        });
        log.info('Vet review assigned', {
            requestId,
            vetId,
        });
        return updated;
    }
    async listResultsReady(limit = 50) {
        const requests = await this.prisma.labRequest.findMany({
            where: {
                status: 'RESULTS_READY',
            },
            include: {
                farmer: true,
                vet: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
        return requests;
    }
}
//# sourceMappingURL=lab-requests.service.js.map