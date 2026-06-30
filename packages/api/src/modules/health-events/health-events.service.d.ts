import { PrismaClient } from '@prisma/client';
import type { CreateHealthEventInput, UpdateHealthEventInput } from './health-events.schema.js';
/**
 * HealthEventsService — vaccination/deworming/treatment tracking
 */
export declare class HealthEventsService {
    private prisma;
    constructor(prisma: PrismaClient);
    createEvent(farmerId: string, input: CreateHealthEventInput): Promise<any>;
    getEvent(eventId: string): Promise<any>;
    listEvents(farmerId: string, limit?: number, offset?: number): Promise<{
        events: any;
        total: any;
    }>;
    getDueReminders(farmerId: string): Promise<any>;
    updateEvent(eventId: string, farmerId: string, input: UpdateHealthEventInput): Promise<any>;
    deleteEvent(eventId: string, farmerId: string): Promise<void>;
    getUpcomingDeadlines(farmerId: string): Promise<any>;
}
//# sourceMappingURL=health-events.service.d.ts.map