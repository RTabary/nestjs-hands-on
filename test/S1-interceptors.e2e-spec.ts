import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

/**
 * Stretch S1 — Interceptors checkpoint test.
 *
 * Asserts the TurboBoostInterceptor's observable side effect: every
 * response includes an `X-Response-Time` header matching `\d+ms`.
 * The interceptor is registered globally via APP_INTERCEPTOR in
 * AppModule, so it picks up here automatically without test-app
 * specific wiring.
 */
describe('Stretch S1 — Interceptors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /vehicles response carries an X-Response-Time header', async () => {
    const res = await request(app.getHttpServer()).get('/vehicles').expect(200);
    const header = res.headers['x-response-time'];
    expect(header).toBeDefined();
    expect(header).toMatch(/^\d+ms$/);
  });

  it('GET /health (a different controller) also carries the header', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-response-time']).toMatch(/^\d+ms$/);
  });
});
