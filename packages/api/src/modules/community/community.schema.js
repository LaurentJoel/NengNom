import { z } from 'zod';
import { UUIDSchema, FullNameSchema } from '@neng-nom/shared/schemas';
/**
 * Community module schemas
 */
export const CreateCommunityPostSchema = z.object({
    content: z.string().min(1).max(10000),
    mediaUrls: z.array(z.string().url()).default([]),
    isAnonymous: z.boolean().default(false),
    category: z.enum(['QUESTION', 'ALERT', 'TIP', 'SALE']).default('QUESTION'),
    tags: z.array(z.string().max(50)).default([]),
});
export const UpdateCommunityPostSchema = z.object({
    content: z.string().min(1).max(10000).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    tags: z.array(z.string().max(50)).optional(),
});
export const CreateCommentSchema = z.object({
    content: z.string().min(1).max(5000),
    mediaUrl: z.string().url().optional(),
});
export const CommunityPostResponseSchema = z.object({
    id: UUIDSchema,
    authorId: UUIDSchema,
    authorName: FullNameSchema.optional(),
    content: z.string(),
    mediaUrls: z.array(z.string().url()),
    isAnonymous: z.boolean(),
    category: z.string(),
    tags: z.array(z.string()),
    likesCount: z.number().int().default(0),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CommunityPostsListSchema = z.array(CommunityPostResponseSchema);
export const PaginatedCommunityPostsSchema = z.object({
    posts: z.array(CommunityPostResponseSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
});
//# sourceMappingURL=community.schema.js.map