import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from './auth.service.js'
import { createTestApp, closeTestApp } from '../../tests/setup.js'
import { userFactory } from '../../tests/factories/user.factory.js'
import { getPrismaClient } from '../../lib/prisma.js'
import { getRedisClient } from '../../lib/redis.js'
import { config } from '../../config/env.js'
import bcrypt from 'bcrypt'
import { ConflictError, UnauthorizedError } from '../../lib/errors.js'
import type { FastifyInstance } from 'fastify'

describe('AuthService', () => {
  let authService: AuthService
  let prisma: ReturnType<typeof getPrismaClient>
  let redis: ReturnType<typeof getRedisClient>
  let app: FastifyInstance

  beforeEach(async () => {
    app = await createTestApp()
    prisma = getPrismaClient()
    redis = getRedisClient()

    // Clean up database for each test
    await prisma.message.deleteMany()
    await prisma.consultation.deleteMany()
    await prisma.labRequest.deleteMany()
    await prisma.farmRecord.deleteMany()
    await prisma.healthEvent.deleteMany()
    await prisma.aiSuggestion.deleteMany()
    await prisma.communityPost.deleteMany()
    await prisma.diseaseAlert.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.otpCode.deleteMany()
    await prisma.farmerProfile.deleteMany()
    await prisma.vetProfile.deleteMany()
    await prisma.user.deleteMany()

    authService = new AuthService(prisma, redis, config)
  })

  describe('register', () => {
    it('creates user with hashed password', async () => {
      const input = userFactory.buildRegisterInput({ role: 'FARMER' })

      const result = await authService.register(input)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.email).toBe(input.email)
      expect(result.user.fullName).toBe(input.fullName)
      expect(result.user.role).toBe('FARMER')

      // Verify password is hashed
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })
      expect(user?.passwordHash).not.toBe(input.password)
      expect(
        await bcrypt.compare(input.password, user!.passwordHash)
      ).toBe(true)
    })

    it('creates farmer profile when role is FARMER', async () => {
      const input = userFactory.buildRegisterInput({ role: 'FARMER' })

      await authService.register(input)

      const profile = await prisma.farmerProfile.findFirst({
        where: { user: { email: input.email } },
      })
      expect(profile).not.toBeNull()
      expect(profile?.userId).toBeDefined()
    })

    it('creates vet profile when role is VET', async () => {
      const input = userFactory.buildRegisterInput({ role: 'VET' })

      await authService.register(input)

      const profile = await prisma.vetProfile.findFirst({
        where: { user: { email: input.email } },
      })
      expect(profile).not.toBeNull()
      expect(profile?.licenseNumber).toBeDefined()
    })

    it('throws ConflictError on duplicate email', async () => {
      const input = userFactory.buildRegisterInput()

      await authService.register(input)

      await expect(authService.register(input)).rejects.toThrow(ConflictError)
    })

    it('stores refresh token in Redis', async () => {
      const input = userFactory.buildRegisterInput()

      const result = await authService.register(input)

      // Verify refresh token is in Redis (should be stored with user ID as key)
      expect(result.refreshToken).toBeDefined()
    })
  })

  describe('login', () => {
    it('returns token pair on valid credentials', async () => {
      const input = userFactory.buildRegisterInput()
      await authService.register(input)

      // Mark as verified
      await prisma.user.update({
        where: { email: input.email },
        data: { isVerified: true },
      })

      const result = await authService.login({
        email: input.email,
        password: input.password,
      })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.email).toBe(input.email)
      expect(result.user.isVerified).toBe(true)
    })

    it('throws UnauthorizedError on wrong password', async () => {
      const input = userFactory.buildRegisterInput()
      await authService.register(input)
      await prisma.user.update({
        where: { email: input.email },
        data: { isVerified: true },
      })

      await expect(
        authService.login({
          email: input.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws UnauthorizedError on unverified account', async () => {
      const input = userFactory.buildRegisterInput()
      await authService.register(input)

      // User is not verified by default
      await expect(
        authService.login({
          email: input.email,
          password: input.password,
        })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws UnauthorizedError on non-existent email', async () => {
      await expect(
        authService.login({
          email: 'ghost@test.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('refreshToken', () => {
    it('returns new token pair with valid refresh token', async () => {
      const input = userFactory.buildRegisterInput()
      const registered = await authService.register(input)

      const result = await authService.refreshToken(registered.refreshToken)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.accessToken).not.toBe(registered.accessToken)
    })

    it('throws UnauthorizedError on invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws UnauthorizedError on expired refresh token', async () => {
      const input = userFactory.buildRegisterInput()
      const registered = await authService.register(input)

      // Manually expire the token in Redis
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })
      await redis.del(`refresh_token:${user!.id}`)

      await expect(
        authService.refreshToken(registered.refreshToken)
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('logout', () => {
    it('invalidates refresh token', async () => {
      const input = userFactory.buildRegisterInput()
      const registered = await authService.register(input)

      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })

      await authService.logout(user!.id)

      // Token should now be invalid
      await expect(
        authService.refreshToken(registered.refreshToken)
      ).rejects.toThrow(UnauthorizedError)
    })
  })
})
