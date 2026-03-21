const apiRuntime = require('../apps/api/dist/index.cjs');
const app = apiRuntime.app ?? apiRuntime.default?.app;

function toFetchRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `${protocol}://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry);
      }
      continue;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const method = req.method ?? 'GET';
  const init = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }

  return new Request(url, init);
}

async function handler(req, res) {
  if (!app) {
    throw new Error('API runtime did not expose a Hono app instance');
  }

  const response = await app.fetch(toFetchRequest(req));

  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

module.exports = handler;
