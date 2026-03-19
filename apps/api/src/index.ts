import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { AppError, isAppError } from './lib/errors';
import { createRateLimit } from './middleware/rateLimit';
import battlesRouter from './routes/battles';
import leaderboardRouter from './routes/leaderboard';
import gunsRouter from './routes/guns';

const app = new Hono();

app.use(
  '*',
  createRateLimit({
    max: 100,
    windowMs: 60_000,
    code: 'RATE_LIMITED',
    message: 'Too many requests',
  })
);

app.use(
  '*',
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  })
);

app.use('*', logger());
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-XSS-Protection', '0');
  await next();
});
app.use(
  '/api/battles/queue',
  createRateLimit({
    max: 10,
    windowMs: 60_000,
    code: 'QUEUE_RATE_LIMITED',
    message: 'Too many queue requests',
  })
);
app.use(
  '/api/leaderboard',
  createRateLimit({
    max: 30,
    windowMs: 60_000,
    code: 'LEADERBOARD_RATE_LIMITED',
    message: 'Too many leaderboard requests',
  })
);
app.use(
  '/api/leaderboard/*',
  createRateLimit({
    max: 30,
    windowMs: 60_000,
    code: 'LEADERBOARD_RATE_LIMITED',
    message: 'Too many leaderboard requests',
  })
);
app.use(
  '/api/guns/*',
  createRateLimit({
    max: 20,
    windowMs: 60_000,
    code: 'GUNS_RATE_LIMITED',
    message: 'Too many gun requests',
  })
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Mount routes
app.route('/api/battles', battlesRouter);
app.route('/api/leaderboard', leaderboardRouter);
app.route('/api/guns', gunsRouter);

// 404 fallback
app.notFound((c) =>
  c.json(
    {
      error: 'Not found',
      code: 'NOT_FOUND',
    },
    404
  )
);

// Error handler
app.onError((err, c) => {
  const knownError = isAppError(err)
    ? err
    : new AppError(500, 'INTERNAL_ERROR', 'Internal server error', false);

  process.stderr.write(
    `${JSON.stringify({
      level: 'error',
      code: knownError.code,
      statusCode: knownError.statusCode,
      method: c.req.method,
      path: c.req.path,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    })}\n`
  );

  return c.json(
    {
      error: knownError.expose ? knownError.message : 'Internal server error',
      code: knownError.code,
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
