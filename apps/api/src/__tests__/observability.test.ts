import { afterEach, describe, expect, it, vi } from 'vitest';

async function importObservability() {
  vi.resetModules();
  return import('../lib/observability');
}

describe('getClientIp', () => {
  const originalAllowUntrusted = process.env['ALLOW_UNTRUSTED_X_FORWARDED_FOR'];

  afterEach(() => {
    if (originalAllowUntrusted === undefined) {
      delete process.env['ALLOW_UNTRUSTED_X_FORWARDED_FOR'];
    } else {
      process.env['ALLOW_UNTRUSTED_X_FORWARDED_FOR'] = originalAllowUntrusted;
    }
  });

  it('prefers trusted proxy headers', async () => {
    const { getClientIp } = await importObservability();
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.1',
      'x-real-ip': '203.0.113.2',
      'x-vercel-forwarded-for': '203.0.113.3',
      'x-forwarded-for': '203.0.113.4',
    });

    expect(getClientIp(headers)).toBe('203.0.113.1');
  });

  it('does not trust raw x-forwarded-for by default', async () => {
    delete process.env['ALLOW_UNTRUSTED_X_FORWARDED_FOR'];
    const { getClientIp } = await importObservability();
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.4, 203.0.113.5',
    });

    expect(getClientIp(headers)).toBe('unknown');
  });

  it('can opt into x-forwarded-for fallback explicitly', async () => {
    process.env['ALLOW_UNTRUSTED_X_FORWARDED_FOR'] = 'true';
    const { getClientIp } = await importObservability();
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.4, 203.0.113.5',
    });

    expect(getClientIp(headers)).toBe('203.0.113.4');
  });
});
