import type { MiddlewareHandler } from 'hono';

interface RateLimitOptions {
  max: number;
  windowMs: number;
  code: string;
  message: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    'local'
  );
}

export function createRateLimit(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const key = `${c.req.path}:${getClientIp(c.req.raw.headers)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      await next();
      return;
    }

    if (bucket.count >= options.max) {
      c.header('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json(
        {
          error: options.message,
          code: options.code,
        },
        429
      );
    }

    bucket.count += 1;
    await next();
  };
}
