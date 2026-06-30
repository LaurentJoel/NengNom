#!/usr/bin/env node

/**
 * CLI script for workers startup
 * Can be run independently or as Docker service
 * Usage: pnpm workers:start
 */

import '../lib/logger.js' // Initialize logging
import { createLogger } from '../lib/logger.js'
import aiSuggestionsWorker, { scheduleDailySuggestions } from './ai-suggestions.worker.js'
import notificationsWorker from '../api/src/lib/notifications.js'

const log = createLogger('workers')

async function startWorkers() {
  try {
    log.info('Starting BullMQ workers...')

    // Start AI suggestions worker
    log.info('Starting AI suggestions worker')
    await aiSuggestionsWorker.waitUntilReady()
    await scheduleDailySuggestions()

    // Start notifications worker
    log.info('Starting notifications worker')
    await notificationsWorker.waitUntilReady()

    log.info('✅ All workers started successfully')

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('SIGTERM received, shutting down workers...')
      await aiSuggestionsWorker.close()
      await notificationsWorker.close()
      log.info('Workers shutdown complete')
      process.exit(0)
    })
  } catch (error) {
    log.error('Failed to start workers', {
      error: (error as Error).message,
    })
    process.exit(1)
  }
}

startWorkers()
