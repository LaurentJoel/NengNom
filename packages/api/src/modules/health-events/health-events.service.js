import { createLogger } from '../../lib/logger.js';
import { NotFoundError } from '../../lib/errors.js';
const log = createLogger('health-events-service');
/**
 * HealthEventsService — vaccination/deworming/treatment tracking
 */
export class HealthEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(farmerId, input) {
        const event = await this.prisma.healthEvent.create({
            data: {
                farmerId,
                eventType: input.eventType,
                productUsed: input.productUsed,
                animalGroup: input.animalGroup,
                eventDate: new Date(input.eventDate),
                nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : null,
                notes: input.notes,
            },
        });
        log.info('Health event created', {
            eventId: event.id,
            farmerId,
            eventType: input.eventType,
            nextDueDate: input.nextDueDate,
        });
        return event;
    }
    async getEvent(eventId) {
        const event = await this.prisma.healthEvent.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new NotFoundError('Health event', eventId);
        }
        return event;
    }
    async listEvents(farmerId, limit = 50, offset = 0) {
        const [events, total] = await Promise.all([
            this.prisma.healthEvent.findMany({
                where: { farmerId },
                orderBy: { eventDate: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.healthEvent.count({ where: { farmerId } }),
        ]);
        return { events, total };
    }
    async getDueReminders(farmerId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reminders = await this.prisma.healthEvent.findMany({
            where: {
                farmerId,
                nextDueDate: {
                    lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
                    gte: today,
                },
            },
            orderBy: { nextDueDate: 'asc' },
        });
        return reminders;
    }
    async updateEvent(eventId, farmerId, input) {
        const event = await this.getEvent(eventId);
        if (event.farmerId !== farmerId) {
            throw new NotFoundError('Health event', eventId);
        }
        const updated = await this.prisma.healthEvent.update({
            where: { id: eventId },
            data: {
                productUsed: input.productUsed,
                animalGroup: input.animalGroup,
                nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : event.nextDueDate,
                notes: input.notes,
            },
        });
        log.info('Health event updated', { eventId, farmerId });
        return updated;
    }
    async deleteEvent(eventId, farmerId) {
        const event = await this.getEvent(eventId);
        if (event.farmerId !== farmerId) {
            throw new NotFoundError('Health event', eventId);
        }
        await this.prisma.healthEvent.delete({
            where: { id: eventId },
        });
        log.info('Health event deleted', { eventId, farmerId });
    }
    async getUpcomingDeadlines(farmerId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlines = await this.prisma.healthEvent.findMany({
            where: {
                farmerId,
                nextDueDate: {
                    gte: today,
                },
            },
            orderBy: { nextDueDate: 'asc' },
            take: 10,
        });
        return deadlines.map((d) => ({
            ...d,
            daysUntilDue: Math.ceil((d.nextDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
        }));
    }
}
//# sourceMappingURL=health-events.service.js.map