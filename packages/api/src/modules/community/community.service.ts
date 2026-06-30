import { PrismaClient, PostCategory } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError, ForbiddenError } from '../../lib/errors.js'
import type { CreateCommunityPostInput, UpdateCommunityPostInput } from './community.schema.js'

const log = createLogger('community-service')

export class CommunityService {
  constructor(private prisma: PrismaClient) {}

  async createPost(authorId: string, input: CreateCommunityPostInput) {
    const post = await this.prisma.communityPost.create({
      data: {
        authorId,
        content: input.content,
        mediaUrls: input.mediaUrls ?? [],
        isAnonymous: input.isAnonymous ?? false,
        category: input.category as PostCategory,
        tags: input.tags ?? [],
      },
      include: { author: true },
    })

    log.info('Community post created', { postId: post.id, authorId, category: input.category })
    return post
  }

  async getPost(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: { author: true },
    })
    if (!post) throw new NotFoundError('Community post', postId)
    return post
  }

  async listPosts(category?: string, limit = 20, offset = 0) {
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: category && category !== 'all' ? { category: category as PostCategory } : undefined,
        include: { author: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.communityPost.count({
        where: category && category !== 'all' ? { category: category as PostCategory } : undefined,
      }),
    ])

    return { posts, total }
  }

  async updatePost(postId: string, authorId: string, input: UpdateCommunityPostInput) {
    const post = await this.getPost(postId)
    if (post.authorId !== authorId) throw new ForbiddenError('You can only edit your own posts')

    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        content: input.content,
        mediaUrls: input.mediaUrls,
        tags: input.tags,
      },
      include: { author: true },
    })

    log.info('Community post updated', { postId, authorId })
    return updated
  }

  async deletePost(postId: string, authorId: string) {
    const post = await this.getPost(postId)
    if (post.authorId !== authorId) throw new ForbiddenError('You can only delete your own posts')

    await this.prisma.communityPost.delete({ where: { id: postId } })
    log.info('Community post deleted', { postId, authorId })
  }

  async likePost(postId: string) {
    const post = await this.getPost(postId)
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount: post.likesCount + 1 },
    })
  }

  async unlikePost(postId: string) {
    const post = await this.getPost(postId)
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount: Math.max(0, post.likesCount - 1) },
    })
  }
}
