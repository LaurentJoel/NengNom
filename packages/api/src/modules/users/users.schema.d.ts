import { z } from 'zod';
/**
 * Users module schemas
 */
export declare const GetUserSchema: any;
export declare const UpdateProfileSchema: any;
export declare const FarmerProfileSchema: any;
export declare const UpdateFarmerProfileSchema: any;
export declare const VetProfileSchema: any;
export declare const UpdateVetProfileSchema: any;
export declare const UserResponseSchema: any;
export declare const UserWithProfileSchema: any;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateFarmerProfileInput = z.infer<typeof UpdateFarmerProfileSchema>;
export type UpdateVetProfileInput = z.infer<typeof UpdateVetProfileSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserWithProfile = z.infer<typeof UserWithProfileSchema>;
//# sourceMappingURL=users.schema.d.ts.map