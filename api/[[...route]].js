import { handle } from '../apps/api/node_modules/hono/dist/adapter/vercel/index.js';
import { app } from '../apps/api/src/index.ts';

export const runtime = 'nodejs';

export default handle(app);
