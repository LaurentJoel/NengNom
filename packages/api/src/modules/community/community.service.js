import { createLogger } from '../../lib/logger.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
const log = createLogger('community-service');
/**
 * CommunityService — community posts and discussions
 */
export class CommunityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(authorId, input) {
        const post = await this.prisma.communityPost.create({
            data: {
                authorId,
                content: input.content,
                mediaUrls: input.mediaUrls,
                isAnonymous: input.isAnonymous,
                category: input.category,
                tags: input.tags,
            },
            include: {
                author: true,
            },
        });
        log.info('Community post created', {
            postId: post.id,
            authorId,
            category: input.category,
            tags: input.tags,
        });
        return post;
    }
    async getPost(postId) {
        const post = await this.prisma.communityPost.findUnique({
            where: { id: postId },
            include: {
                author: true,
            },
        });
        if (!post) {
            throw new NotFoundError('Community post', postId);
        }
        return post;
    }
    async listPosts(category, tags, limit = 20, offset = 0) {
        const [posts, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where: {
                    ...(category && { category }),
                    ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
                },
                include: {
                    author: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.communityPost.count({
                where: {
                    ...(category && { category }),
                    ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
                },
            }),
        ]);
        return { posts, total };
    }
    async searchPosts(query, limit = 20, offset = 0) {
        const [posts, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where: {
                    content: {
                        search: query.split(' ').join(' & '),
                    },
                },
                include: {
                    author: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.communityPost.count({
                where: {
                    content: {
                        search: query.split(' ').join(' & '),
                    },
                },
            }),
        ]);
        return { posts, total };
    }
    async updatePost(postId, authorId, input) {
        const post = await this.getPost(postId);
        if (post.authorId !== authorId) {
            throw new ForbiddenError('You can only edit your own posts');
        }
        const updated = await this.prisma.communityPost.update({
            where: { id: postId },
            data: {
                content: input.content,
                mediaUrls: input.mediaUrls,
                tags: input.tags,
            },
            include: {
                author: true,
            },
        });
        log.info('Community post updated', { postId, authorId });
        return updated;
    }
    async deletePost(postId, authorId) {
        const post = await this.getPost(postId);
        if (post.authorId !== authorId) {
            throw new ForbiddenError('You can only delete your own posts');
        }
        await this.prisma.communityPost.delete({
            where: { id: postId },
        });
        log.info('Community post deleted', { postId, authorId });
    }
    async likePost(postId) {
        const post = await this.getPost(postId);
        const updated = await this.prisma.communityPost.update({
            where: { id: postId },
            data: {
                likesCount: post.likesCount + 1,
            },
        });
        return updated;
    }
    async unlikePost(postId) {
        const post = await this.getPost(postId);
        const updated = await this.prisma.communityPost.update({
            where: { id: postId },
            data: {
                likesCount: Math.max(0, post.likesCount - 1),
            },
        });
        return updated;
    }
    async getTrendingTopics(days = 7, limit = 10) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const posts = await this.prisma.communityPost.findMany({
            where: {
                createdAt: { gte: since },
            },
        });
        const tagCounts = {};
        posts.forEach((post) => {
            post.tags.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const trending = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
        return trending;
    }
}
//# sourceMappingURL=community.service.js.map