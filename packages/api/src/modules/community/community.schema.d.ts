import { z } from 'zod';
/**
 * Community module schemas
 */
export declare const CreateCommunityPostSchema: any;
export declare const UpdateCommunityPostSchema: any;
export declare const CreateCommentSchema: any;
export declare const CommunityPostResponseSchema: any;
export declare const CommunityPostsListSchema: any;
export declare const PaginatedCommunityPostsSchema: any;
export type CreateCommunityPostInput = z.infer<typeof CreateCommunityPostSchema>;
export type UpdateCommunityPostInput = z.infer<typeof UpdateCommunityPostSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CommunityPostResponse = z.infer<typeof CommunityPostResponseSchema>;
export type PaginatedCommunityPosts = z.infer<typeof PaginatedCommunityPostsSchema>;
//# sourceMappingURL=community.schema.d.ts.map