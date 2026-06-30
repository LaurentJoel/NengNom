import { createLogger } from '../../lib/logger.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
const log = createLogger('consultations-service');
/**
 * ConsultationsService — consultation and messaging
 */
export class ConsultationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConsultation(farmerId, input) {
        const consultation = await this.prisma.consultation.create({
            data: {
                farmerId,
                vetId: input.vetId,
                type: input.type,
                symptomsDescription: input.symptomsDescription,
                mediaUrls: input.mediaUrls,
            },
            include: { messages: true },
        });
        log.info('Consultation created', {
            consultationId: consultation.id,
            farmerId,
            vetId: input.vetId,
            type: input.type,
        });
        return consultation;
    }
    async getConsultation(consultationId) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: consultationId },
            include: {
                farmer: { include: { user: true } },
                vet: { include: { user: true } },
                messages: {
                    orderBy: { sentAt: 'asc' },
                    include: { sender: true },
                },
            },
        });
        if (!consultation) {
            throw new NotFoundError('Consultation', consultationId);
        }
        return consultation;
    }
    async listConsultations(farmerId, limit = 20, offset = 0) {
        const [consultations, total] = await Promise.all([
            this.prisma.consultation.findMany({
                where: { farmerId },
                include: {
                    farmer: true,
                    vet: true,
                    messages: {
                        take: 1,
                        orderBy: { sentAt: 'desc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.consultation.count({ where: { farmerId } }),
        ]);
        return { consultations, total };
    }
    async listVetConsultations(vetId, limit = 20, offset = 0) {
        const [consultations, total] = await Promise.all([
            this.prisma.consultation.findMany({
                where: { vetId },
                include: {
                    farmer: true,
                    messages: {
                        take: 1,
                        orderBy: { sentAt: 'desc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.consultation.count({ where: { vetId } }),
        ]);
        return { consultations, total };
    }
    async updateConsultation(consultationId, userId, input) {
        const consultation = await this.getConsultation(consultationId);
        // Only farmer or assigned vet can update
        const farmer = await this.prisma.farmerProfile.findUnique({
            where: { id: consultation.farmerId },
        });
        if (farmer?.userId !== userId && consultation.vet?.userId !== userId) {
            throw new ForbiddenError('You do not have permission to update this consultation');
        }
        const updated = await this.prisma.consultation.update({
            where: { id: consultationId },
            data: {
                status: input.status,
                prescription: input.prescription,
                fee: input.fee,
                ...(input.status === 'ACTIVE' && { startedAt: new Date() }),
                ...(input.status === 'CLOSED' && { endedAt: new Date() }),
            },
            include: { messages: true },
        });
        log.info('Consultation updated', { consultationId, status: input.status });
        return updated;
    }
    async addMessage(consultationId, senderId, input) {
        const consultation = await this.getConsultation(consultationId);
        // Verify sender is farmer or vet in this consultation
        const farmer = await this.prisma.farmerProfile.findUnique({
            where: { id: consultation.farmerId },
        });
        if (farmer?.userId !== senderId && consultation.vet?.userId !== senderId) {
            throw new ForbiddenError('You are not part of this consultation');
        }
        const message = await this.prisma.message.create({
            data: {
                consultationId,
                senderId,
                content: input.content,
                mediaUrl: input.mediaUrl,
                messageType: input.messageType,
            },
            include: { sender: true },
        });
        // Update consultation status if first message from vet
        if (consultation.status === 'PENDING' && consultation.vet?.userId === senderId) {
            await this.prisma.consultation.update({
                where: { id: consultationId },
                data: { status: 'ACTIVE', startedAt: new Date() },
            });
        }
        log.info('Message sent', {
            consultationId,
            senderId,
            messageType: input.messageType,
        });
        return message;
    }
    async getMessages(consultationId, limit = 50, offset = 0) {
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { consultationId },
                include: { sender: true },
                orderBy: { sentAt: 'asc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.message.count({ where: { consultationId } }),
        ]);
        return { messages, total };
    }
}
//# sourceMappingURL=consultations.service.js.map