import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

// NestJS runs guards BEFORE pipes, so once step 06 lands every POST
// here would short-circuit with 401 instead of 400 unless we set the
// x-api-key. The header is ignored on solution/04 (no guard yet),
// required from solution/06 onward — forward-compat patch.
const API_KEY = { 'x-api-key': 'pit-pass' };

describe('Step 04 — DTOs & Validation Pipes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /manufacturers returns the seeded roster (≥ 5 entries)', async () => {
    const res = await request(app.getHttpServer())
      .get('/manufacturers')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
  });

  it('POST /vehicles with an invalid VIN returns 400', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .set(API_KEY)
      .send({
        make: 'Mini',
        model: 'Cooper',
        year: 2020,
        vin: 'TOO_SHORT',
        mileageKm: 42_000,
        manufacturerId: 'MFR003',
      })
      .expect(400);
  });

  it('POST /vehicles with a valid body returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set(API_KEY)
      .send({
        make: 'Mini',
        model: 'Cooper',
        year: 2020,
        vin: 'WMWXM5C50K2T12345',
        mileageKm: 42_000,
        manufacturerId: 'MFR003',
      })
      .expect(201);
    expect(res.body.id).toMatch(/^V\d{3}$/);
  });

  it('POST /manufacturers rejects a non-ISO country code', async () => {
    await request(app.getHttpServer())
      .post('/manufacturers')
      .set(API_KEY)
      .send({ name: 'Bogus', country: 'France', foundedYear: 1980 })
      .expect(400);
  });

  it('POST /manufacturers accepts a valid ISO country code', async () => {
    const res = await request(app.getHttpServer())
      .post('/manufacturers')
      .set(API_KEY)
      .send({ name: 'Workshop Motors', country: 'WS', foundedYear: 2026 })
      .expect(201);
    expect(res.body.id).toMatch(/^MFR\d{3}$/);
  });
});
