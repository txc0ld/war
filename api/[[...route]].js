import { app } from '../apps/api/src/index.ts';

export const runtime = 'nodejs';

export default async function handler(request) {
  return app.fetch(request);
}
