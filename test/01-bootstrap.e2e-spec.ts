import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

describe('Step 01 — Bootstrap & Modules (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSec).toBe('number');
  });

  it('GET /vroom returns a fun fact', async () => {
    const res = await request(app.getHttpServer()).get('/vroom').expect(200);
    expect(typeof res.body.fact).toBe('string');
    expect(res.body.fact.length).toBeGreaterThan(0);
  });
});
