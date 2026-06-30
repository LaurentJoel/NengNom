import { createLogger } from '../../lib/logger.js';
import { NotFoundError } from '../../lib/errors.js';
const log = createLogger('users-service');
/**
 * UsersService — user profile management
 */
export class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                farmerProfile: true,
                vetProfile: true,
            },
        });
        if (!user) {
            throw new NotFoundError('User', userId);
        }
        return this.formatUserResponse(user);
    }
    async getUserByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                farmerProfile: true,
                vetProfile: true,
            },
        });
        if (!user) {
            throw new NotFoundError('User', email);
        }
        return this.formatUserResponse(user);
    }
    async updateProfile(userId, input) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: input.fullName,
                phone: input.phone,
                region: input.region,
            },
            include: {
                farmerProfile: true,
                vetProfile: true,
            },
        });
        log.info('Profile updated', { userId, changes: Object.keys(input) });
        return this.formatUserResponse(user);
    }
    async updateFarmerProfile(userId, input) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { farmerProfile: true },
        });
        if (!user?.farmerProfile) {
            throw new NotFoundError('Farmer profile', userId);
        }
        const profile = await this.prisma.farmerProfile.update({
            where: { id: user.farmerProfile.id },
            data: {
                farmName: input.farmName,
                farmType: input.farmType,
                animalCount: input.animalCount,
                gpsLocation: input.gpsLocation,
            },
        });
        log.info('Farmer profile updated', { userId, farmerId: profile.id });
        return profile;
    }
    async updateVetProfile(userId, input) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { vetProfile: true },
        });
        if (!user?.vetProfile) {
            throw new NotFoundError('Vet profile', userId);
        }
        const profile = await this.prisma.vetProfile.update({
            where: { id: user.vetProfile.id },
            data: {
                specialization: input.specialization,
                hourlyRate: input.hourlyRate,
                isAvailable: input.isAvailable,
            },
        });
        log.info('Vet profile updated', { userId, vetId: profile.id });
        return profile;
    }
    async searchUsers(query, role) {
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { fullName: { contains: query, mode: 'insensitive' } },
                ],
                ...(role && { role: role }),
            },
            include: {
                farmerProfile: true,
                vetProfile: true,
            },
            take: 20,
        });
        return users.map((u) => this.formatUserResponse(u));
    }
    formatUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            country: user.country,
            region: user.region,
            phone: user.phone,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            farmerProfile: user.farmerProfile,
            vetProfile: user.vetProfile,
        };
    }
}
//# sourceMappingURL=users.service.js.map