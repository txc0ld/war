import apiRuntime from '../apps/api/dist/index.js';

export const runtime = 'nodejs';

export default async function handler(request) {
  return apiRuntime.fetch(request);
}
