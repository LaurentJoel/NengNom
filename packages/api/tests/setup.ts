/**
 * Test setup using Testcontainers
 * Spins up real PostgreSQL and Redis for integration tests
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { RedisContainer } from '@testcontainers/redis'
import { execSync } from 'child_process'
import { createApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'

let pgContainer: PostgreSqlContainer
let redisContainer: RedisContainer
let testApp: FastifyInstance

export async function setupTestContainers() {
  console.log('🐳 Starting Testcontainers...')

  // Start containers in parallel
  ;[pgContainer, redisContainer] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('neng_nom_test')
      .withUsername('neng_nom')
      .withUserPassword('testpass')
      .start(),
    new RedisContainer('redis:7-alpine').start(),
  ])

  // Set environment variables
  const pgUri = pgContainer.getConnectionUri()
  process.env['DATABASE_URL'] = pgUri
  process.env['DIRECT_DATABASE_URL'] = pgUri
  process.env['REDIS_URL'] = redisContainer.getConnectionUrl()
  process.env['NODE_ENV'] = 'test'

  console.log('✅ Testcontainers ready')

  // Run Prisma migrations
  console.log('🔄 Running migrations...')
  execSync('pnpm -F @neng-nom/api prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env as NodeJS.ProcessEnv,
  })

  console.log('✅ Migrations complete')
}

export async function teardownTestContainers() {
  console.log('🧹 Cleaning up Testcontainers...')
  await Promise.all([pgContainer.stop(), redisContainer.stop()])
  console.log('✅ Cleanup complete')
}

export async function createTestApp(): Promise<FastifyInstance> {
  if (!testApp) {
    testApp = await createApp()
  }
  return testApp
}

export async function closeTestApp() {
  if (testApp) {
    await testApp.close()
  }
}

// Global setup/teardown
beforeAll(async () => {
  await setupTestContainers()
}, 120_000) // 2 minute timeout for container startup

afterAll(async () => {
  await closeTestApp()
  await teardownTestContainers()
}, 60_000) // 1 minute timeout for cleanup
