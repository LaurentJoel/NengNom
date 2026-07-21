import { PrismaClient } from '@prisma/client'
import { NotFoundError } from './errors.js'
import { cached, cacheDel, cacheKeys, CACHE_TTL } from './cache.js'

/**
 * Resolves userId -> profile id.
 *
 * Nearly every farmer-scoped request needs this translation, so before caching
 * it cost one extra database round trip per request. The mapping only changes
 * when a profile is created or deleted, so it caches well.
 */

export async function resolveFarmerProfileId(
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  const id = await cached(cacheKeys.farmerId(userId), CACHE_TTL.FARMER_ID, async () => {
    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    return profile?.id ?? null
  })

  if (!id) throw new NotFoundError('Farmer profile', userId)
  return id
}

/**
 * Returns null when the user has no vet profile — callers rely on this rather
 * than catching, so it must not throw.
 */
export async function resolveVetProfileId(
  prisma: PrismaClient,
  userId: string
): Promise<string | null> {
  return cached(cacheKeys.vetId(userId), CACHE_TTL.FARMER_ID, async () => {
    const profile = await prisma.vetProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    return profile?.id ?? null
  })
}

/** Call when a profile is created or deleted so the mapping cannot go stale. */
export async function invalidateProfileIds(userId: string): Promise<void> {
  await cacheDel(cacheKeys.farmerId(userId), cacheKeys.vetId(userId))
}
