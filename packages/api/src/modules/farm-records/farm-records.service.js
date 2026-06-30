import { createLogger } from '../../lib/logger.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
const log = createLogger('farm-records-service');
/**
 * FarmRecordsService — production records management
 */
export class FarmRecordsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRecord(farmerId, input) {
        // Check for duplicate record on same date
        const existing = await this.prisma.farmRecord.findUnique({
            where: {
                farmerId_recordDate: {
                    farmerId,
                    recordDate: new Date(input.recordDate),
                },
            },
        });
        if (existing) {
            throw new ConflictError(`A record already exists for this date. Use update to modify it.`);
        }
        const record = await this.prisma.farmRecord.create({
            data: {
                farmerId,
                recordDate: new Date(input.recordDate),
                animalCount: input.animalCount,
                mortalityCount: input.mortalityCount,
                feedConsumedKg: input.feedConsumedKg,
                expenses: input.expenses,
                revenue: input.revenue,
                notes: input.notes,
            },
        });
        log.info('Farm record created', {
            recordId: record.id,
            farmerId,
            recordDate: input.recordDate,
        });
        return record;
    }
    async getRecord(recordId) {
        const record = await this.prisma.farmRecord.findUnique({
            where: { id: recordId },
        });
        if (!record) {
            throw new NotFoundError('Farm record', recordId);
        }
        return record;
    }
    async listRecords(farmerId, limit = 30, offset = 0) {
        const [records, total] = await Promise.all([
            this.prisma.farmRecord.findMany({
                where: { farmerId },
                orderBy: { recordDate: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.farmRecord.count({ where: { farmerId } }),
        ]);
        return { records, total };
    }
    async getRecordsBetween(farmerId, startDate, endDate) {
        const records = await this.prisma.farmRecord.findMany({
            where: {
                farmerId,
                recordDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { recordDate: 'asc' },
        });
        return records;
    }
    async updateRecord(recordId, farmerId, input) {
        const record = await this.getRecord(recordId);
        // Verify ownership
        if (record.farmerId !== farmerId) {
            throw new NotFoundError('Farm record', recordId);
        }
        const updated = await this.prisma.farmRecord.update({
            where: { id: recordId },
            data: {
                animalCount: input.animalCount ?? record.animalCount,
                mortalityCount: input.mortalityCount ?? record.mortalityCount,
                feedConsumedKg: input.feedConsumedKg,
                expenses: input.expenses,
                revenue: input.revenue,
                notes: input.notes,
            },
        });
        log.info('Farm record updated', { recordId, farmerId });
        return updated;
    }
    async deleteRecord(recordId, farmerId) {
        const record = await this.getRecord(recordId);
        if (record.farmerId !== farmerId) {
            throw new NotFoundError('Farm record', recordId);
        }
        await this.prisma.farmRecord.delete({
            where: { id: recordId },
        });
        log.info('Farm record deleted', { recordId, farmerId });
    }
    async getMonthlyStats(farmerId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const records = await this.getRecordsBetween(farmerId, startDate, endDate);
        const stats = {
            daysRecorded: records.length,
            avgAnimalCount: records.length > 0
                ? Math.round(records.reduce((sum, r) => sum + r.animalCount, 0) / records.length)
                : 0,
            totalMortality: records.reduce((sum, r) => sum + r.mortalityCount, 0),
            mortalityRate: records.length > 0
                ? (records.reduce((sum, r) => sum + r.mortalityCount, 0) /
                    records.reduce((sum, r) => sum + r.animalCount, 0) *
                    100).toFixed(2)
                : 0,
            avgFeedConsumption: records.filter((r) => r.feedConsumedKg).length > 0
                ? (records.reduce((sum, r) => sum + (r.feedConsumedKg || 0), 0) /
                    records.filter((r) => r.feedConsumedKg).length).toFixed(2)
                : 0,
            totalExpenses: records.reduce((sum, r) => sum + (r.expenses?.toNumber() || 0), 0),
            totalRevenue: records.reduce((sum, r) => sum + (r.revenue?.toNumber() || 0), 0),
        };
        return stats;
    }
}
//# sourceMappingURL=farm-records.service.js.map