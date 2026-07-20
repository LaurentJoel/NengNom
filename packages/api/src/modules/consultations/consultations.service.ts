import { PrismaClient } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError, ForbiddenError } from '../../lib/errors.js'
import type { CreateConsultationInput, UpdateConsultationInput, CreateMessageInput } from './consultations.schema.js'

const log = createLogger('consultations-service')

const CONSULTATION_FEES: Record<string, number> = {
  CHAT: 2000,
  VIDEO: 5000,
  VOICE: 3000,
  EMERGENCY: 3000,
}

export class ConsultationsService {
  constructor(private prisma: PrismaClient) {}

  private async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Farmer profile', userId)
    return profile.id
  }

  private async getVetProfileId(userId: string): Promise<string | null> {
    const profile = await this.prisma.vetProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    return profile?.id ?? null
  }

  async createConsultation(userId: string, input: CreateConsultationInput) {
    const farmerId = await this.getFarmerProfileId(userId)

    const consultation = await this.prisma.consultation.create({
      data: {
        farmerId,
        vetId: input.vetId,
        type: input.type,
        symptomsDescription: input.symptomsDescription,
        mediaUrls: input.mediaUrls ?? [],
        fee: CONSULTATION_FEES[input.type] ?? 2000,
      },
      include: {
        farmer: { include: { user: true } },
        vet: { include: { user: true } },
        messages: true,
      },
    })

    log.info('Consultation created', { consultationId: consultation.id, farmerId, vetId: input.vetId })
    return consultation
  }

  async getConsultation(consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        farmer: { include: { user: true } },
        vet: { include: { user: true } },
        messages: { orderBy: { sentAt: 'asc' }, include: { sender: true } },
      },
    })

    if (!consultation) throw new NotFoundError('Consultation', consultationId)
    return consultation
  }

  async listConsultations(userId: string, limit = 20, offset = 0) {
    const farmerId = await this.getFarmerProfileId(userId)

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where: { farmerId },
        include: {
          vet: { include: { user: true } },
          messages: { take: 1, orderBy: { sentAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.consultation.count({ where: { farmerId } }),
    ])

    return { consultations, total }
  }

  async listVetConsultations(userId: string, limit = 20, offset = 0) {
    const vetId = await this.getVetProfileId(userId)
    if (!vetId) return { consultations: [], total: 0 }

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where: { vetId, paymentStatus: 'PAID' },
        include: {
          farmer: { include: { user: true } },
          messages: { take: 1, orderBy: { sentAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.consultation.count({ where: { vetId, paymentStatus: 'PAID' } }),
    ])

    return { consultations, total }
  }

  async updateConsultation(consultationId: string, userId: string, input: UpdateConsultationInput) {
    const consultation = await this.getConsultation(consultationId)

    const farmerUserId = consultation.farmer?.user?.id
    const vetUserId = consultation.vet?.user?.id

    if (farmerUserId !== userId && vetUserId !== userId) {
      throw new ForbiddenError('You do not have permission to update this consultation')
    }

    const isVet = vetUserId === userId

    const updated = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: input.status,
        // Prescription and fee are vet-only — farmers cannot self-prescribe or zero out fees
        ...(isVet && { prescription: input.prescription, fee: input.fee }),
        ...(input.status === 'ACTIVE' && { startedAt: new Date() }),
        ...(input.status === 'CLOSED' && { endedAt: new Date() }),
      },
      include: {
        farmer: { include: { user: true } },
        vet: { include: { user: true } },
        messages: true,
      },
    })

    log.info('Consultation updated', { consultationId, status: input.status })
    return updated
  }

  async addMessage(consultationId: string, userId: string, input: CreateMessageInput) {
    const consultation = await this.getConsultation(consultationId)

    const farmerUserId = consultation.farmer?.user?.id
    const vetUserId = consultation.vet?.user?.id

    if (farmerUserId !== userId && vetUserId !== userId) {
      throw new ForbiddenError('You are not part of this consultation')
    }

    const message = await this.prisma.message.create({
      data: {
        consultationId,
        senderId: userId,
        content: input.content,
        mediaUrl: input.mediaUrl,
        messageType: input.messageType ?? 'text',
      },
      include: { sender: true },
    })

    if (consultation.status === 'PENDING' && vetUserId === userId) {
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: 'ACTIVE', startedAt: new Date() },
      })
    }

    log.info('Message sent', { consultationId, senderId: userId })
    return message
  }

  async getMessages(consultationId: string, limit = 50, offset = 0) {
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { consultationId },
        include: { sender: true },
        orderBy: { sentAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.message.count({ where: { consultationId } }),
    ])

    return { messages, total }
  }
}
