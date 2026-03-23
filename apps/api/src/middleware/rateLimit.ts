import { and, lt, sql } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { db } from '../db/client';
import { rateLimitBuckets } from '../db/schema';
import { AppError } from '../lib/errors';
import { getClientIp } from '../lib/observability';

interface RateLimitOptions {
  scope: string;
  max: number;
  windowMs: number;
  code: string;
  message: string;
}

const BUCKET_RETENTION_MS = 24 * 60 * 60 * 1000;
let nextCleanupAt = 0;

function getBucketStart(now: number, windowMs: number): Date {
  return new Date(Math.floor(now / windowMs) * windowMs);
}

async function cleanupStaleBuckets(now: number): Promise<void> {
  if (now < nextCleanupAt) {
    return;
  }

  nextCleanupAt = now + 5 * 60 * 1000;

  await db
    .delete(rateLimitBuckets)
    .where(
      lt(rateLimitBuckets.bucketStart, new Date(now - BUCKET_RETENTION_MS))
    );
}

export function createRateLimit(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const bucketStart = getBucketStart(now, options.windowMs);
    const resetAt = bucketStart.getTime() + options.windowMs;
    const identifier = getClientIp(c.req.raw.headers);

    try {
      await cleanupStaleBuckets(now);

      const [bucket] = await db
        .insert(rateLimitBuckets)
        .values({
          scope: options.scope,
          identifier,
          bucketStart,
          count: 1,
          updatedAt: new Date(now),
        })
        .onConflictDoUpdate({
          target: [
            rateLimitBuckets.scope,
            rateLimitBuckets.identifier,
            rateLimitBuckets.bucketStart,
          ],
          set: {
            count: sql`${rateLimitBuckets.count} + 1`,
            updatedAt: new Date(now),
          },
        })
        .returning({ count: rateLimitBuckets.count });

      const count = Number(bucket?.count ?? 0);
      const remaining = Math.max(0, options.max - count);

      c.header('X-RateLimit-Limit', String(options.max));
      c.header('X-RateLimit-Remaining', String(remaining));
      c.header('X-RateLimit-Reset', new Date(resetAt).toISOString());

      if (count > options.max) {
        c.header('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
        return c.json(
          {
            error: options.message,
            code: options.code,
          },
          429
        );
      }
    } catch (error) {
      throw new AppError(
        503,
        'RATE_LIMIT_UNAVAILABLE',
        error instanceof Error
          ? `Rate limiter unavailable: ${error.message}`
          : 'Rate limiter unavailable',
        false
      );
    }

    await next();
  };
}
