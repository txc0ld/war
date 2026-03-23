import { randomUUID } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';

export interface StructuredLog {
  level: 'info' | 'error';
  event: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  clientIp?: string;
  userAgent?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
}

function firstForwardedIp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.split(',')[0]?.trim() || null;
}

export function getClientIp(headers: Headers): string {
  const trustedProxyIp =
    firstForwardedIp(headers.get('cf-connecting-ip')) ??
    firstForwardedIp(headers.get('x-real-ip')) ??
    firstForwardedIp(headers.get('x-vercel-forwarded-for'));

  if (trustedProxyIp) {
    return trustedProxyIp;
  }

  return firstForwardedIp(headers.get('x-forwarded-for')) ?? 'unknown';
}

export function ensureRequestId(c: Context): string {
  const existing =
    c.res.headers.get('x-request-id') ?? c.req.header('x-request-id') ?? null;

  if (existing) {
    c.header('x-request-id', existing);
    return existing;
  }

  const requestId = randomUUID();
  c.header('x-request-id', requestId);
  return requestId;
}

export function writeStructuredLog(entry: StructuredLog): void {
  const stream = entry.level === 'error' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(entry)}\n`);
}

export const structuredLogger: MiddlewareHandler = async (c, next) => {
  const startedAt = Date.now();
  const requestId = ensureRequestId(c);

  await next();

  writeStructuredLog({
    level: 'info',
    event: 'http_request',
    requestId,
    method: c.req.method,
    path: c.req.path,
    statusCode: c.res.status,
    durationMs: Date.now() - startedAt,
    clientIp: getClientIp(c.req.raw.headers),
    userAgent: c.req.header('user-agent') ?? undefined,
  });
};
