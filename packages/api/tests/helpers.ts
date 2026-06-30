/**
 * Test helpers and utilities
 */
import type { FastifyInstance } from 'fastify'
import type { IncomingHttpHeaders } from 'http'
import { createTestApp } from './setup.js'

export async function getTestApp(): Promise<FastifyInstance> {
  return createTestApp()
}

/**
 * Helper to create an Authorization header
 */
export function authHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Helper to make authenticated requests
 */
export async function authenticatedRequest(
  app: FastifyInstance,
  accessToken: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown
) {
  const request = app[method.toLowerCase() as Lowercase<typeof method>](url)
    .set(authHeader(accessToken))

  if (body) {
    request.send(body)
  }

  return request
}
