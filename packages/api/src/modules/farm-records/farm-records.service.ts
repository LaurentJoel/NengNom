import { PrismaClient } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError, ConflictError } from '../../lib/errors.js'
import type { CreateFarmRecordInput, UpdateFarmRecordInput } from './farm-records.schema.js'

const log = createLogger('farm-records-service')

export class FarmRecordsService {
  constructor(private prisma: PrismaClient) {}

  private async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Farmer profile', userId)
    return profile.id
  }

  async createRecord(userId: string, input: CreateFarmRecordInput) {
    const farmerId = await this.getFarmerProfileId(userId)

    const existing = await this.prisma.farmRecord.findUnique({
      where: { farmerId_recordDate: { farmerId, recordDate: new Date(input.recordDate) } },
    })
    if (existing) {
      throw new ConflictError('A record already exists for this date. Use update to modify it.')
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
    })

    log.info('Farm record created', { recordId: record.id, farmerId })
    return record
  }

  async getRecord(recordId: string) {
    const record = await this.prisma.farmRecord.findUnique({ where: { id: recordId } })
    if (!record) throw new NotFoundError('Farm record', recordId)
    return record
  }

  async listRecords(userId: string, limit = 30, offset = 0) {
    const farmerId = await this.getFarmerProfileId(userId)

    const [records, total] = await Promise.all([
      this.prisma.farmRecord.findMany({
        where: { farmerId },
        orderBy: { recordDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.farmRecord.count({ where: { farmerId } }),
    ])

    return { records, total }
  }

  async updateRecord(recordId: string, userId: string, input: UpdateFarmRecordInput) {
    const farmerId = await this.getFarmerProfileId(userId)
    const record = await this.getRecord(recordId)

    if (record.farmerId !== farmerId) throw new NotFoundError('Farm record', recordId)

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
    })

    log.info('Farm record updated', { recordId, farmerId })
    return updated
  }

  async deleteRecord(recordId: string, userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)
    const record = await this.getRecord(recordId)

    if (record.farmerId !== farmerId) throw new NotFoundError('Farm record', recordId)

    await this.prisma.farmRecord.delete({ where: { id: recordId } })
    log.info('Farm record deleted', { recordId, farmerId })
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const farmerId = await this.getFarmerProfileId(userId)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const records = await this.prisma.farmRecord.findMany({
      where: { farmerId, recordDate: { gte: startDate, lte: endDate } },
      orderBy: { recordDate: 'asc' },
    })

    return {
      daysRecorded: records.length,
      avgAnimalCount: records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.animalCount, 0) / records.length)
        : 0,
      totalMortality: records.reduce((s, r) => s + r.mortalityCount, 0),
      mortalityRate: records.length > 0
        ? ((records.reduce((s, r) => s + r.mortalityCount, 0) /
            records.reduce((s, r) => s + r.animalCount, 0)) * 100).toFixed(2)
        : '0',
      avgFeedConsumption: records.filter((r) => r.feedConsumedKg).length > 0
        ? (records.reduce((s, r) => s + (r.feedConsumedKg || 0), 0) /
            records.filter((r) => r.feedConsumedKg).length).toFixed(2)
        : '0',
      totalExpenses: records.reduce((s, r) => s + (r.expenses?.toNumber() || 0), 0),
      totalRevenue: records.reduce((s, r) => s + (r.revenue?.toNumber() || 0), 0),
      records,
    }
  }
}
