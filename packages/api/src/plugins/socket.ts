import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import { createLogger } from '../lib/logger.js'
import { config } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

const log = createLogger('socket')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default fp(async function socketPlugin(fastify: FastifyInstance) {
  // Pre-compute the canonical origin set once (prevents prefix-bypass via origin.startsWith)
  const allowedSet = new Set(
    config.ALLOWED_ORIGINS.map(o => {
      try { return new URL(o.trim()).origin } catch { return o.trim() }
    })
  )

  const io = new Server(fastify.server, {
    cors: {
      // Allow native mobile clients (no Origin header) and explicitly listed web origins.
      origin: (origin, cb) => {
        if (!origin) return cb(null, true) // React Native / native apps send no Origin
        try {
          if (allowedSet.has(new URL(origin).origin)) return cb(null, true)
        } catch {}
        log.warn('Socket CORS rejected', { origin })
        cb(new Error('Origin not allowed'))
      },
      credentials: false,
    },
    transports: ['websocket', 'polling'],
  })

  // Authenticate every socket connection with the JWT access token.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string
      if (!token) return next(new Error('Unauthorized'))
      const payload = fastify.jwt.verify<{ id: string; role: string }>(token)
      socket.data.userId = payload.id
      socket.data.role = payload.role
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    log.debug('Socket connected', { userId: socket.data.userId })

    // Verify the requesting user is actually a participant before joining the room.
    socket.on('join-consultation', async (consultationId: unknown, ack?: (ok: boolean) => void) => {
      try {
        if (typeof consultationId !== 'string' || !UUID_RE.test(consultationId)) {
          return ack?.(false)
        }

        const userId = socket.data.userId as string
        const consult = await fastify.prisma.consultation.findUnique({
          where: { id: consultationId },
          select: {
            farmer: { select: { userId: true } },
            vet:    { select: { userId: true } },
          },
        })

        const isParticipant = !!consult &&
          (consult.farmer?.userId === userId || consult.vet?.userId === userId)

        if (!isParticipant) {
          log.warn('Unauthorized room join attempt', { userId, consultationId })
          return ack?.(false)
        }

        socket.join(`consultation:${consultationId}`)
        log.debug('Joined consultation room', { userId, consultationId })
        ack?.(true)
      } catch (err) {
        log.error('Error in join-consultation', { err })
        ack?.(false)
      }
    })

    socket.on('leave-consultation', (consultationId: unknown) => {
      if (typeof consultationId === 'string' && UUID_RE.test(consultationId)) {
        socket.leave(`consultation:${consultationId}`)
      }
    })

    socket.on('disconnect', () => {
      log.debug('Socket disconnected', { userId: socket.data.userId })
    })
  })

  fastify.decorate('io', io)
  log.info('Socket.io initialized')
})
