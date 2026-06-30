import { PrismaClient, LabStatus, LabTestType } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError } from '../../lib/errors.js'
import type { CreateLabRequestInput, UpdateLabRequestInput } from './lab-requests.schema.js'

const log = createLogger('lab-requests-service')

export class LabRequestsService {
  constructor(private prisma: PrismaClient) {}

  private async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Farmer profile', userId)
    return profile.id
  }

  async createRequest(userId: string, input: CreateLabRequestInput) {
    const farmerId = await this.getFarmerProfileId(userId)

    const request = await this.prisma.labRequest.create({
      data: {
        farmerId,
        gpsLocation: input.gpsLocation,
        testType: input.testType as LabTestType,
        instructions: input.instructions,
        status: 'REQUESTED' as LabStatus,
      },
      include: { farmer: { include: { user: true } } },
    })

    log.info('Lab request created', { requestId: request.id, farmerId, testType: input.testType })
    return request
  }

  async getRequest(requestId: string) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id: requestId },
      include: {
        farmer: { include: { user: true } },
        vet: { include: { user: true } },
      },
    })
    if (!request) throw new NotFoundError('Lab request', requestId)
    return request
  }

  async listRequests(userId: string, limit = 20, offset = 0) {
    const farmerId = await this.getFarmerProfileId(userId)

    const [requests, total] = await Promise.all([
      this.prisma.labRequest.findMany({
        where: { farmerId },
        include: { farmer: { include: { user: true } }, vet: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.labRequest.count({ where: { farmerId } }),
    ])

    return { requests, total }
  }

  async updateRequest(requestId: string, input: UpdateLabRequestInput) {
    const existing = await this.getRequest(requestId)

    const updated = await this.prisma.labRequest.update({
      where: { id: requestId },
      data: {
        status: input.status as LabStatus | undefined,
        priceQuoted: input.priceQuoted,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        resultUrl: input.resultUrl,
        vetReview: input.vetReview,
      },
      include: {
        farmer: { include: { user: true } },
        vet: { include: { user: true } },
      },
    })

    log.info('Lab request updated', { requestId, status: input.status })
    return updated
  }
}
