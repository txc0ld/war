import { handle } from 'hono/vercel';
import { app } from '../apps/api/dist/index.js';

export const runtime = 'nodejs';

export default handle(app);
