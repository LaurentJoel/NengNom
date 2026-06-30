import bcrypt from 'bcrypt';
import { createLogger } from '../../lib/logger.js';
import { ConflictError, UnauthorizedError, NotFoundError, } from '../../lib/errors.js';
import { BCRYPT_ROUNDS, REDIS } from '../../config/constants.js';
const log = createLogger('auth-service');
/**
 * AuthService — pure business logic layer
 * No HTTP/Fastify concerns here
 * All dependencies injected (Prisma, Redis, config)
 */
export class AuthService {
    prisma;
    redis;
    config;
    constructor(prisma, redis, config) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
    }
    /**
     * Register a new user
     * Creates user, hashes password, generates token pair
     */
    async register(input) {
        log.info('Register attempt', { email: input.email, role: input.role });
        // Check for duplicate email
        const existing = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new ConflictError('An account with this email already exists');
        }
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        // Create user with role-specific profile
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                phone: input.phone,
                passwordHash,
                role: input.role,
                fullName: input.fullName,
                country: input.country,
                region: input.region,
                farmerProfile: input.role === 'FARMER'
                    ? { create: {} }
                    : undefined,
                vetProfile: input.role === 'VET'
                    ? {
                        create: {
                            licenseNumber: `TEMP-${Date.now()}`,
                        },
                    }
                    : undefined,
            },
        });
        log.info('User registered successfully', {
            userId: user.id,
            role: user.role,
            email: user.email,
        });
        return this.generateTokenPair(user);
    }
    /**
     * Login with email and password
     * Validates credentials and returns token pair
     */
    async login(input) {
        log.info('Login attempt', { email: input.email });
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            log.warn('Login failed: user not found', { email: input.email });
            throw new UnauthorizedError('Invalid email or password');
        }
        // Verify password
        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!validPassword) {
            log.warn('Login failed: invalid password', { userId: user.id });
            throw new UnauthorizedError('Invalid email or password');
        }
        // Check if user is verified
        if (!user.isVerified) {
            log.warn('Login failed: user not verified', { userId: user.id });
            throw new UnauthorizedError('Please verify your account before logging in');
        }
        // Check if user is active
        if (!user.isActive) {
            log.warn('Login failed: user inactive', { userId: user.id });
            throw new UnauthorizedError('Your account has been deactivated');
        }
        log.info('User logged in successfully', {
            userId: user.id,
            role: user.role,
        });
        return this.generateTokenPair(user);
    }
    /**
     * Generate access + refresh token pair
     * Access token: short-lived (15min)
     * Refresh token: long-lived (7d), stored in Redis
     */
    async generateTokenPair(user) {
        const accessToken = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        const refreshTokenValue = `refresh_${user.id}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}`;
        // Store refresh token in Redis with expiration
        const refreshTTL = this.config.JWT_REFRESH_TTL;
        await this.redis.setex(`${REDIS.KEY_REFRESH_TOKEN_PREFIX}${user.id}`, refreshTTL, refreshTokenValue);
        // Build response (in production, would use JWT signing)
        const response = {
            accessToken: Buffer.from(JSON.stringify(accessToken)).toString('base64'),
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
        };
        return response;
    }
    /**
     * Refresh access token using refresh token
     * Returns new token pair
     */
    async refreshToken(refreshToken) {
        log.debug('Refreshing token');
        // Find user by refresh token in Redis
        const keys = await this.redis.keys(`${REDIS.KEY_REFRESH_TOKEN_PREFIX}*`);
        let userId = null;
        for (const key of keys) {
            const stored = await this.redis.get(key);
            if (stored === refreshToken) {
                userId = key.replace(REDIS.KEY_REFRESH_TOKEN_PREFIX, '');
                break;
            }
        }
        if (!userId) {
            log.warn('Refresh token validation failed');
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
        // Fetch user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundError('User', userId);
        }
        log.info('Token refreshed', { userId: user.id });
        return this.generateTokenPair(user);
    }
    /**
     * Logout by invalidating refresh token
     */
    async logout(userId) {
        log.info('User logging out', { userId });
        await this.redis.del(`${REDIS.KEY_REFRESH_TOKEN_PREFIX}${userId}`);
    }
}
//# sourceMappingURL=auth.service.js.map