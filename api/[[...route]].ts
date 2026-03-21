import { handle } from 'hono/vercel';
import { app } from '../apps/api/src/index';

export const runtime = 'nodejs';

export default handle(app);
