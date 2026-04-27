import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

describe('Step 03 — Providers & Dependency Injection (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /spare-parts returns the seeded roster (≥ 20 entries)', async () => {
    const res = await request(app.getHttpServer())
      .get('/spare-parts')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(20);
  });

  it('GET /vehicles/V009/compatible-parts includes the flux capacitor', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles/V009/compatible-parts')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const flux = (res.body as Array<{ partNumber: string }>).find(
      (p) => p.partNumber === 'FLUX-CAP-MK2',
    );
    expect(flux).toBeDefined();
  });

  it('GET /vehicles/V999/compatible-parts returns 404 (vehicle unknown)', async () => {
    await request(app.getHttpServer())
      .get('/vehicles/V999/compatible-parts')
      .expect(404);
  });
});
