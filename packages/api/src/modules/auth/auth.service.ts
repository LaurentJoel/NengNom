import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { createLogger } from '../../lib/logger.js'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../lib/errors.js'
import { BCRYPT_ROUNDS, REDIS } from '../../config/constants.js'
import type { AppConfig } from '../../config/env.js'
import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
} from './auth.schema.js'

const log = createLogger('auth-service')

export type SignFn = (payload: object, options?: { expiresIn?: number | string }) => string

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: AppConfig,
    private signFn: SignFn
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    log.info('Register attempt', { phone: input.phone, role: input.role })

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    })
    if (existingPhone) {
      throw new ConflictError('An account with this phone number already exists')
    }

    if (input.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: input.email } })
      if (existingEmail) throw new ConflictError('An account with this email already exists')
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

    const user = await this.prisma.user.create({
      data: {
        email: input.email || `${input.phone.replace('+', '')}@neng-nom.local`,
        phone: input.phone,
        passwordHash,
        role: input.role,
        fullName: input.fullName,
        country: input.country || 'CM',
        region: input.region,
        isVerified: true,
        farmerProfile:
          input.role === 'FARMER' ? { create: {} } : undefined,
        vetProfile:
          input.role === 'VET'
            ? { create: { licenseNumber: `VET-${Date.now()}` } }
            : undefined,
      },
    })

    log.info('User registered', { userId: user.id, role: user.role })
    return this.generateTokenPair(user)
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    log.info('Login attempt', { phone: input.phone })

    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    })

    // Check both existence and isActive before bcrypt to avoid credential enumeration
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid phone number or password')
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash)
    if (!validPassword) {
      throw new UnauthorizedError('Invalid phone number or password')
    }

    log.info('User logged in', { userId: user.id, role: user.role })
    return this.generateTokenPair(user)
  }

  private async generateTokenPair(user: any): Promise<AuthResponse> {
    const payload = { id: user.id, email: user.email, role: user.role }

    const accessToken = this.signFn(payload, {
      expiresIn: this.config.JWT_ACCESS_TTL,
    })

    const refreshTokenValue = randomBytes(32).toString('hex')

    const pipeline = this.redis.pipeline()
    pipeline.setex(
      `${REDIS.KEY_REFRESH_TOKEN_PREFIX}${refreshTokenValue}`,
      this.config.JWT_REFRESH_TTL,
      user.id
    )
    pipeline.setex(
      `${REDIS.KEY_REFRESH_UID_PREFIX}${user.id}`,
      this.config.JWT_REFRESH_TTL,
      refreshTokenValue
    )
    await pipeline.exec()

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        country: user.country,
        region: user.region,
        phone: user.phone,
      },
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const userId = await this.redis.get(`${REDIS.KEY_REFRESH_TOKEN_PREFIX}${refreshToken}`)

    if (!userId) {
      throw new UnauthorizedError('Invalid or expired refresh token')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User', userId)

    return this.generateTokenPair(user)
  }

  async logout(userId: string): Promise<void> {
    const token = await this.redis.get(`${REDIS.KEY_REFRESH_UID_PREFIX}${userId}`)
    const pipeline = this.redis.pipeline()
    if (token) {
      pipeline.del(`${REDIS.KEY_REFRESH_TOKEN_PREFIX}${token}`)
    }
    pipeline.del(`${REDIS.KEY_REFRESH_UID_PREFIX}${userId}`)
    await pipeline.exec()
  }
}
