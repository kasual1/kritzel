import { afterEach, describe, expect, it, vi } from 'vitest';

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value as string);
  return import('../site-urls.mjs');
}

describe('site URLs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the Upmade domains', async () => {
    const { SITE_URL, APP_URL } = await load({ UPMADE_WEBSITE_URL: '', UPMADE_APP_URL: '' });
    expect(SITE_URL).toBe('https://upmade.io');
    expect(APP_URL).toBe('https://app.upmade.io');
  });

  it('can be built for another domain', async () => {
    const { SITE_URL, APP_URL } = await load({ UPMADE_WEBSITE_URL: 'https://example.com/', UPMADE_APP_URL: 'https://app.example.com' });
    expect(SITE_URL).toBe('https://example.com');
    expect(APP_URL).toBe('https://app.example.com');
  });

  it('rejects values that are not an origin', async () => {
    await expect(load({ UPMADE_WEBSITE_URL: 'example.com' })).rejects.toThrow(/absolute URL/);
    await expect(load({ UPMADE_WEBSITE_URL: 'https://example.com/docs' })).rejects.toThrow(/without a path/);
  });
});
