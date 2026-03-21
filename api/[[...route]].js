export const runtime = 'nodejs';

let apiRuntimePromise;

async function loadApiRuntime() {
  if (!apiRuntimePromise) {
    apiRuntimePromise = import('../apps/api/dist/index.js');
  }

  return apiRuntimePromise;
}

export default async function handler(request) {
  const module = await loadApiRuntime();
  const apiRuntime = module.default ?? module;
  return apiRuntime.fetch(request);
}
