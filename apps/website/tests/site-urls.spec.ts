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

  it('defaults to the Updraw domains', async () => {
    const { SITE_URL, APP_URL } = await load({ UPDRAW_WEBSITE_URL: '', UPDRAW_APP_URL: '' });
    expect(SITE_URL).toBe('https://updraw.io');
    expect(APP_URL).toBe('https://app.updraw.io');
  });

  it('can be built for another domain', async () => {
    const { SITE_URL, APP_URL } = await load({ UPDRAW_WEBSITE_URL: 'https://kritzel.io/', UPDRAW_APP_URL: 'https://app.kritzel.io' });
    expect(SITE_URL).toBe('https://kritzel.io');
    expect(APP_URL).toBe('https://app.kritzel.io');
  });

  it('rejects values that are not an origin', async () => {
    await expect(load({ UPDRAW_WEBSITE_URL: 'kritzel.io' })).rejects.toThrow(/absolute URL/);
    await expect(load({ UPDRAW_WEBSITE_URL: 'https://kritzel.io/docs' })).rejects.toThrow(/without a path/);
  });
});
