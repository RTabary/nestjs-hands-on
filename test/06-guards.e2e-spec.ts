import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

describe('Step 06 — Guards (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /vehicles is public (no x-api-key required)', async () => {
    await request(app.getHttpServer()).get('/vehicles').expect(200);
  });

  it('GET /health and GET /vroom stay public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/vroom').expect(200);
  });

  it('POST /vehicles without x-api-key returns 401', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .send({
        make: 'Mini',
        model: 'Cooper',
        year: 2020,
        vin: 'WMWXM5C50K2T12345',
        mileageKm: 42_000,
        manufacturerId: 'MFR003',
      })
      .expect(401);
  });

  it('POST /vehicles with the correct x-api-key returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('x-api-key', 'pit-pass')
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

  it('POST /vehicles with the wrong x-api-key returns 401', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .set('x-api-key', 'wrong-key')
      .send({
        make: 'Mini',
        model: 'Cooper',
        year: 2020,
        vin: 'WMWXM5C50K2T12345',
        mileageKm: 42_000,
        manufacturerId: 'MFR003',
      })
      .expect(401);
  });
});
