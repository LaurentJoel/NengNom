import { Queue, Worker } from 'bullmq'
import { getRedisClient } from '../../lib/redis.js'
import { getPrismaClient } from '../../lib/prisma.js'
import { createLogger } from '../../lib/logger.js'
import { AIService } from '../api/src/modules/ai/ai.service.js'

const log = createLogger('ai-suggestions-worker')
const redis = getRedisClient()
const prisma = getPrismaClient()

/**
 * Daily AI Suggestions Worker
 * Generates fresh suggestions for all farmers every 24 hours
 */
export const aiSuggestionsQueue = new Queue('ai-suggestions', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const aiSuggestionsWorker = new Worker(
  'ai-suggestions',
  async (job) => {
    const farmerId = job.data.farmerId
    log.info('Processing AI suggestions job', { farmerId, jobId: job.id })

    const aiService = new AIService(prisma)

    try {
      const suggestion = await aiService.generateSuggestions(farmerId)
      return { success: true, suggestionId: suggestion.id }
    } catch (error) {
      log.error('AI suggestions job failed', {
        farmerId,
        jobId: job.id,
        error: (error as Error).message,
      })
      throw error
    }
  },
  { connection: redis }
)

aiSuggestionsWorker.on('completed', (job) => {
  log.info('AI suggestions job completed', {
    jobId: job.id,
    farmerId: job.data.farmerId,
  })
})

aiSuggestionsWorker.on('failed', (job, error) => {
  log.error('AI suggestions job failed permanently', {
    jobId: job?.id,
    farmerId: job?.data.farmerId,
    error: error.message,
  })
})

/**
 * Schedule daily suggestions generation for all farmers
 * Runs at 8 AM each day
 */
export async function scheduleDailySuggestions() {
  await aiSuggestionsQueue.add(
    'daily-suggestions',
    {},
    {
      repeat: {
        pattern: '0 8 * * *', // 8 AM every day
      },
    }
  )

  log.info('Daily AI suggestions scheduled')
}

/**
 * Generate suggestions for a specific farmer
 */
export async function queueFarmerSuggestions(farmerId: string) {
  await aiSuggestionsQueue.add('generate-for-farmer', { farmerId })
}

export default aiSuggestionsWorker
