import { PrismaClient } from '@prisma/client';
import type { UpdateProfileInput, UpdateFarmerProfileInput, UpdateVetProfileInput } from './users.schema.js';
/**
 * UsersService — user profile management
 */
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaClient);
    getUser(userId: string): Promise<{
        id: any;
        email: any;
        fullName: any;
        role: any;
        country: any;
        region: any;
        phone: any;
        isVerified: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
        farmerProfile: any;
        vetProfile: any;
    }>;
    getUserByEmail(email: string): Promise<{
        id: any;
        email: any;
        fullName: any;
        role: any;
        country: any;
        region: any;
        phone: any;
        isVerified: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
        farmerProfile: any;
        vetProfile: any;
    }>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<{
        id: any;
        email: any;
        fullName: any;
        role: any;
        country: any;
        region: any;
        phone: any;
        isVerified: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
        farmerProfile: any;
        vetProfile: any;
    }>;
    updateFarmerProfile(userId: string, input: UpdateFarmerProfileInput): Promise<any>;
    updateVetProfile(userId: string, input: UpdateVetProfileInput): Promise<any>;
    searchUsers(query: string, role?: string): Promise<any>;
    private formatUserResponse;
}
//# sourceMappingURL=users.service.d.ts.map