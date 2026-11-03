import { describe, expect, it } from 'vitest';
import { requireOrigin } from '../src/auth';
import worker from '../src/index';
import type { Env } from '../src/env';

const env: Env = {
  DB: {
    prepare: () => { throw new Error('Domain routing must not query the database.'); },
    batch: async () => { throw new Error('Domain routing must not query the database.'); },
  },
  AUTH_SECRET: 'domain-routing-test-secret',
  CODE_HMAC_KEY: 'domain-routing-test-code-key',
  ASSETS: { fetch: async () => new Response('site content') },
};

describe('Wayella domain routing', () => {
  it('redirects www to HTTPS at the main domain, preserving the path and query', async () => {
    const response = await worker.fetch(new Request('https://www.wayella.com/guides/japan/?source=shared%20link'), env);
    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('https://wayella.com/guides/japan/?source=shared%20link');
  });

  it('upgrades HTTP at the main domain', async () => {
    const response = await worker.fetch(new Request('http://wayella.com/stories/?tab=moments'), env);
    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('https://wayella.com/stories/?tab=moments');
  });

  it.each(['https://wayella.com', 'https://globeguide.pages.dev', 'https://preview.globeguide.pages.dev', 'http://127.0.0.1:3000'])(
    'serves content at %s without a redirect loop', async (origin) => {
      const response = await worker.fetch(new Request(`${origin}/guides/`), env);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('site content');
    },
  );

  it('accepts same-origin writes on the new domain and rejects writes from another origin', () => {
    const request = (origin: string) => new Request('https://wayella.com/api/auth/login', { method: 'POST', headers: { Origin: origin } });
    expect(requireOrigin(request('https://wayella.com'))).toBe(true);
    expect(requireOrigin(request('https://globeguide.pages.dev'))).toBe(false);
    expect(requireOrigin(request('https://evil.example'))).toBe(false);
  });
});
