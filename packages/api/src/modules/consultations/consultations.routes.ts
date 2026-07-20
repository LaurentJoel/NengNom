import { FastifyInstance } from 'fastify'
import { createHmac } from 'crypto'
import { ConsultationsService } from './consultations.service.js'
import {
  CreateConsultationSchema,
  UpdateConsultationSchema,
  CreateMessageSchema,
} from './consultations.schema.js'
import { ForbiddenError } from '../../lib/errors.js'
import { config } from '../../config/env.js'
import { sendPushNotification } from '../../lib/push.js'

/**
 * Consultations routes
 */
export async function consultationsRoutes(fastify: FastifyInstance) {
  const service = new ConsultationsService(fastify.prisma)

  /**
   * POST /consultations
   * Create a consultation
   */
  fastify.post(
    '/consultations',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Consultations'], summary: 'Create consultation with vet' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = CreateConsultationSchema.parse(request.body)
      const result = await service.createConsultation(userId, body)
      return reply.status(201).send(result)
    }
  )

  /**
   * GET /consultations/:id
   * Get consultation by ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/consultations/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Get consultation details' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const result = await service.getConsultation(request.params.id)
      const farmerUserId = result.farmer?.user?.id
      const vetUserId    = result.vet?.user?.id
      if (farmerUserId !== userId && vetUserId !== userId) {
        throw new ForbiddenError('You are not a participant of this consultation')
      }
      return reply.send(result)
    }
  )

  /**
   * GET /consultations
   * List consultations
   */
  fastify.get(
    '/consultations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Consultations'],
        summary: 'List consultations',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 },
            status: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as any
      const { limit, offset } = request.query as { limit: number; offset: number }

      let result
      if (user.role === 'FARMER') {
        result = await service.listConsultations(user.id, limit, offset)
      } else if (user.role === 'VET') {
        result = await service.listVetConsultations(user.id, limit, offset)
      }

      return reply.send(result)
    }
  )

  /**
   * PATCH /consultations/:id
   * Update consultation
   */
  fastify.patch<{ Params: { id: string } }>(
    '/consultations/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Update consultation' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = UpdateConsultationSchema.parse(request.body)
      const result = await service.updateConsultation(request.params.id, userId, body)
      fastify.io?.to(`consultation:${request.params.id}`).emit('consultation-updated', { status: result.status })
      return reply.send(result)
    }
  )

  /**
   * POST /consultations/:id/pay
   * Mock payment — marks the consultation as PAID and notifies participants.
   */
  fastify.post<{ Params: { id: string } }>(
    '/consultations/:id/pay',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Consultations'], summary: 'Pay for a consultation (mock)' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const consultation = await service.getConsultation(request.params.id)

      if (consultation.farmer?.user?.id !== userId) {
        throw new ForbiddenError('You are not the farmer of this consultation')
      }

      if ((consultation as any).paymentStatus === 'PAID') {
        return reply.send(consultation)
      }

      const updated = await fastify.prisma.consultation.update({
        where: { id: request.params.id },
        data: { paymentStatus: 'PAID' },
        include: {
          farmer: { include: { user: true } },
          vet: { include: { user: true } },
        },
      })

      fastify.io?.to(`consultation:${request.params.id}`).emit('payment-confirmed', {
        consultationId: request.params.id,
      })

      // Notify vet that a paid consultation is waiting
      const vetToken = (updated.vet?.user as any)?.pushToken
      const farmerName = updated.farmer?.user?.fullName ?? 'Un éleveur'
      await sendPushNotification(
        vetToken,
        'Nouvelle consultation payée',
        `${farmerName} a réglé une consultation. Connectez-vous pour répondre.`,
        { consultationId: request.params.id },
      )

      return reply.send(updated)
    }
  )

  /**
   * POST /consultations/:id/messages
   * Send message in consultation
   */
  fastify.post<{ Params: { id: string } }>(
    '/consultations/:id/messages',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Send message in consultation' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const consultation = await service.getConsultation(request.params.id)

      if ((consultation as any).paymentStatus !== 'PAID') {
        return reply.status(402).send({
          error: { code: 'PAYMENT_REQUIRED', message: 'Veuillez régler la consultation avant d\'envoyer des messages.' },
        })
      }

      const body = CreateMessageSchema.parse(request.body)
      const result = await service.addMessage(request.params.id, userId, body)
      fastify.io?.to(`consultation:${request.params.id}`).emit('new-message', result)

      // Push notification to the other participant
      const farmerUserId = consultation.farmer?.user?.id
      const isFromFarmer = userId === farmerUserId
      const recipientToken = isFromFarmer
        ? (consultation.vet?.user as any)?.pushToken
        : (consultation.farmer?.user as any)?.pushToken
      const senderName = isFromFarmer
        ? (consultation.farmer?.user?.fullName ?? 'Éleveur')
        : (consultation.vet?.user?.fullName ?? 'Vétérinaire')

      await sendPushNotification(
        recipientToken,
        senderName,
        body.content ?? 'Nouveau message',
        { consultationId: request.params.id },
      )

      return reply.status(201).send(result)
    }
  )

  /**
   * GET /consultations/:id/video-room
   * Returns the Jitsi room name for verified participants only.
   * The room name is HMAC-derived server-side so clients cannot guess it.
   */
  fastify.get<{ Params: { id: string } }>(
    '/consultations/:id/video-room',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Get video room token for a consultation' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const consultation = await service.getConsultation(request.params.id)

      const farmerUserId = consultation.farmer?.user?.id
      const vetUserId    = consultation.vet?.user?.id
      if (farmerUserId !== userId && vetUserId !== userId) {
        throw new ForbiddenError('You are not a participant of this consultation')
      }

      if ((consultation as any).paymentStatus !== 'PAID') {
        return reply.status(402).send({
          error: { code: 'PAYMENT_REQUIRED', message: 'Veuillez régler la consultation avant de rejoindre la vidéo.' },
        })
      }

      const roomSecret = config.VIDEO_ROOM_SECRET ?? config.JWT_ACCESS_SECRET
      const roomName = createHmac('sha256', roomSecret)
        .update(request.params.id)
        .digest('hex')
        .slice(0, 32)

      const callerName = userId === farmerUserId
        ? (consultation.farmer?.user?.fullName ?? 'Éleveur')
        : (consultation.vet?.user?.fullName ?? 'Vétérinaire')
      fastify.io?.to(`consultation:${request.params.id}`).emit('video-call-started', {
        callerUserId: userId,
        callerName,
        roomName,
      })

      return reply.send({ roomName })
    }
  )

  /**
   * GET /consultations/:id/messages
   * Get consultation messages
   */
  fastify.get<{ Params: { id: string } }>(
    '/consultations/:id/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Consultations'],
        summary: 'Get consultation messages',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const { limit, offset } = request.query as { limit: number; offset: number }
      const consultation = await service.getConsultation(request.params.id)
      const farmerUserId = consultation.farmer?.user?.id
      const vetUserId    = consultation.vet?.user?.id
      if (farmerUserId !== userId && vetUserId !== userId) {
        throw new ForbiddenError('You are not a participant of this consultation')
      }
      const result = await service.getMessages(request.params.id, limit, offset)
      return reply.send(result)
    }
  )
}
