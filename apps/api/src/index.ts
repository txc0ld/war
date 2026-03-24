import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError, isAppError } from './lib/errors';
import {
  ensureRequestId,
  structuredLogger,
  writeStructuredLog,
} from './lib/observability';
import { getReadinessStatus } from './lib/readiness';
import { createRateLimit } from './middleware/rateLimit';
import battlesRouter from './routes/battles';
import chatRouter from './routes/chat';
import gunsRouter from './routes/guns';
import killfeedRouter from './routes/killfeed';
import leaderboardRouter from './routes/leaderboard';
import profilesRouter from './routes/profiles';

const app = new Hono();
const defaultAllowedOrigins = new Set([
  'http://localhost:5173',
  'https://the-warroom.vercel.app',
  'https://www.glocksandnode.xyz',
]);

for (const origin of (process.env['CORS_ORIGIN'] ?? '').split(',')) {
  const trimmedOrigin = origin.trim();
  if (trimmedOrigin) {
    defaultAllowedOrigins.add(trimmedOrigin);
  }
}

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return origin;
      }

      return defaultAllowedOrigins.has(origin) ? origin : '';
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use('*', async (c, next) => {
  ensureRequestId(c);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-XSS-Protection', '0');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "script-src 'self' https://vercel.live",
      "connect-src 'self' https: wss:",
    ].join('; ')
  );
  await next();
});

app.use('*', structuredLogger);

app.use(
  '/api/health',
  createRateLimit({
    scope: 'health',
    max: 30,
    windowMs: 60_000,
    code: 'HEALTH_RATE_LIMITED',
    message: 'Too many health requests',
  })
);
app.use(
  '/api/ready',
  createRateLimit({
    scope: 'readiness',
    max: 10,
    windowMs: 60_000,
    code: 'READINESS_RATE_LIMITED',
    message: 'Too many readiness requests',
  })
);
app.use(
  '/api/chat',
  createRateLimit({
    scope: 'global_chat',
    max: 60,
    windowMs: 60_000,
    code: 'CHAT_RATE_LIMITED',
    message: 'Too many chat requests',
  })
);
app.use(
  '/api/killfeed',
  createRateLimit({
    scope: 'killfeed',
    max: 60,
    windowMs: 60_000,
    code: 'KILLFEED_RATE_LIMITED',
    message: 'Too many killfeed requests',
  })
);
app.use(
  '/api/profiles/*',
  createRateLimit({
    scope: 'profiles',
    max: 30,
    windowMs: 60_000,
    code: 'PROFILE_RATE_LIMITED',
    message: 'Too many profile requests',
  })
);
app.use(
  '/api/battles/*',
  createRateLimit({
    scope: 'battles',
    max: 30,
    windowMs: 60_000,
    code: 'BATTLES_RATE_LIMITED',
    message: 'Too many battle requests',
  })
);
app.use(
  '/api/battles/queue',
  createRateLimit({
    scope: 'queue_join',
    max: 10,
    windowMs: 60_000,
    code: 'QUEUE_RATE_LIMITED',
    message: 'Too many queue requests',
  })
);
app.use(
  '/api/battles/queue/:queueId/cancel',
  createRateLimit({
    scope: 'queue_cancel',
    max: 10,
    windowMs: 60_000,
    code: 'QUEUE_CANCEL_RATE_LIMITED',
    message: 'Too many queue cancellation requests',
  })
);
app.use(
  '/api/leaderboard',
  createRateLimit({
    scope: 'leaderboard',
    max: 30,
    windowMs: 60_000,
    code: 'LEADERBOARD_RATE_LIMITED',
    message: 'Too many leaderboard requests',
  })
);
app.use(
  '/api/leaderboard/*',
  createRateLimit({
    scope: 'leaderboard_player',
    max: 30,
    windowMs: 60_000,
    code: 'LEADERBOARD_RATE_LIMITED',
    message: 'Too many leaderboard requests',
  })
);
app.use(
  '/api/guns/*',
  createRateLimit({
    scope: 'guns',
    max: 20,
    windowMs: 60_000,
    code: 'GUNS_RATE_LIMITED',
    message: 'Too many gun requests',
  })
);

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: ensureRequestId(c),
  })
);

app.get('/api/ready', async (c) => {
  const readiness = await getReadinessStatus();
  return c.json(readiness, readiness.status === 'ready' ? 200 : 503);
});

app.route('/api/battles', battlesRouter);
app.route('/api/chat', chatRouter);
app.route('/api/leaderboard', leaderboardRouter);
app.route('/api/killfeed', killfeedRouter);
app.route('/api/profiles', profilesRouter);
app.route('/api/guns', gunsRouter);

app.notFound((c) =>
  c.json(
    {
      error: 'Not found',
      code: 'NOT_FOUND',
      requestId: ensureRequestId(c),
    },
    404
  )
);

app.onError((err, c) => {
  const knownError = isAppError(err)
    ? err
    : new AppError(500, 'INTERNAL_ERROR', 'Internal server error', false);
  const requestId = ensureRequestId(c);
  const isServerError = knownError.statusCode >= 500;

  writeStructuredLog({
    level: isServerError ? 'error' : 'info',
    event: isServerError ? 'http_error' : 'http_rejected',
    requestId,
    code: knownError.code,
    statusCode: knownError.statusCode,
    method: c.req.method,
    path: c.req.path,
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: isServerError && err instanceof Error ? err.stack : undefined,
  });

  return c.json(
    {
      error: knownError.expose ? knownError.message : 'Internal server error',
      code: knownError.code,
      requestId,
    },
    knownError.statusCode
  );
});

const port = Number(process.env['PORT'] ?? 3001);

export { app };
export default {
  port,
  fetch: app.fetch,
};
