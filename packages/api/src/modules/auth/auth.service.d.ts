import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import type { AppConfig } from '../../config/env.js';
import type { RegisterInput, LoginInput, AuthResponse } from './auth.schema.js';
/**
 * AuthService — pure business logic layer
 * No HTTP/Fastify concerns here
 * All dependencies injected (Prisma, Redis, config)
 */
export declare class AuthService {
    private prisma;
    private redis;
    private config;
    constructor(prisma: PrismaClient, redis: Redis, config: AppConfig);
    /**
     * Register a new user
     * Creates user, hashes password, generates token pair
     */
    register(input: RegisterInput): Promise<AuthResponse>;
    /**
     * Login with email and password
     * Validates credentials and returns token pair
     */
    login(input: LoginInput): Promise<AuthResponse>;
    /**
     * Generate access + refresh token pair
     * Access token: short-lived (15min)
     * Refresh token: long-lived (7d), stored in Redis
     */
    private generateTokenPair;
    /**
     * Refresh access token using refresh token
     * Returns new token pair
     */
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    /**
     * Logout by invalidating refresh token
     */
    logout(userId: string): Promise<void>;
}
//# sourceMappingURL=auth.service.d.ts.map