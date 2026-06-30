import { PrismaClient } from '@prisma/client';
import type { CreateCommunityPostInput, UpdateCommunityPostInput } from './community.schema.js';
/**
 * CommunityService — community posts and discussions
 */
export declare class CommunityService {
    private prisma;
    constructor(prisma: PrismaClient);
    createPost(authorId: string, input: CreateCommunityPostInput): Promise<any>;
    getPost(postId: string): Promise<any>;
    listPosts(category?: string, tags?: string[], limit?: number, offset?: number): Promise<{
        posts: any;
        total: any;
    }>;
    searchPosts(query: string, limit?: number, offset?: number): Promise<{
        posts: any;
        total: any;
    }>;
    updatePost(postId: string, authorId: string, input: UpdateCommunityPostInput): Promise<any>;
    deletePost(postId: string, authorId: string): Promise<void>;
    likePost(postId: string): Promise<any>;
    unlikePost(postId: string): Promise<any>;
    getTrendingTopics(days?: number, limit?: number): Promise<{
        tag: string;
        count: number;
    }[]>;
}
//# sourceMappingURL=community.service.d.ts.map