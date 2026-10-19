import { afterEach, describe, expect, it } from 'vitest';

import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createApp } from '../src/main.js';

describe('health endpoint', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns the API health contract and request id', async () => {
    app = await createApp();
    await app.init();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/v1/health',
      headers: { 'x-request-id': 'test-request-id' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe('test-request-id');
    expect(response.json()).toMatchObject({ status: 'ok', version: '0.1.0' });
  });

  it('returns the stable error envelope for unknown routes', async () => {
    app = await createApp();
    await app.init();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/v1/does-not-exist',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: 'HTTP_404',
      messageKey: 'errors.http_request_failed',
    });
    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });
});
