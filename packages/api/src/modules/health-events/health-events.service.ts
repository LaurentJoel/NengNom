import { PrismaClient } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError } from '../../lib/errors.js'
import type { CreateHealthEventInput, UpdateHealthEventInput } from './health-events.schema.js'

const log = createLogger('health-events-service')

export class HealthEventsService {
  constructor(private prisma: PrismaClient) {}

  private async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Farmer profile', userId)
    return profile.id
  }

  async createEvent(userId: string, input: CreateHealthEventInput) {
    const farmerId = await this.getFarmerProfileId(userId)

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
    })

    log.info('Health event created', { eventId: event.id, farmerId, eventType: input.eventType })
    return event
  }

  async getEvent(eventId: string) {
    const event = await this.prisma.healthEvent.findUnique({ where: { id: eventId } })
    if (!event) throw new NotFoundError('Health event', eventId)
    return event
  }

  async listEvents(userId: string, limit = 50, offset = 0) {
    const farmerId = await this.getFarmerProfileId(userId)

    const [events, total] = await Promise.all([
      this.prisma.healthEvent.findMany({
        where: { farmerId },
        orderBy: { eventDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.healthEvent.count({ where: { farmerId } }),
    ])

    return { events, total }
  }

  async updateEvent(eventId: string, userId: string, input: UpdateHealthEventInput) {
    const farmerId = await this.getFarmerProfileId(userId)
    const event = await this.getEvent(eventId)

    if (event.farmerId !== farmerId) throw new NotFoundError('Health event', eventId)

    const updated = await this.prisma.healthEvent.update({
      where: { id: eventId },
      data: {
        productUsed: input.productUsed,
        animalGroup: input.animalGroup,
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : event.nextDueDate,
        notes: input.notes,
      },
    })

    log.info('Health event updated', { eventId, farmerId })
    return updated
  }

  async deleteEvent(eventId: string, userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)
    const event = await this.getEvent(eventId)

    if (event.farmerId !== farmerId) throw new NotFoundError('Health event', eventId)

    await this.prisma.healthEvent.delete({ where: { id: eventId } })
    log.info('Health event deleted', { eventId, farmerId })
  }

  async getUpcomingDeadlines(userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const deadlines = await this.prisma.healthEvent.findMany({
      where: { farmerId, nextDueDate: { gte: today } },
      orderBy: { nextDueDate: 'asc' },
      take: 10,
    })

    return deadlines.map((d) => ({
      ...d,
      daysUntilDue: Math.ceil(
        (d.nextDueDate!.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      ),
    }))
  }
}
