import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

describe('Step 02 — Controllers & Routing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /vehicles returns the seeded roster (≥ 12 entries)', async () => {
    const res = await request(app.getHttpServer()).get('/vehicles').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(12);
  });

  it('POST /vehicles creates a vehicle and round-trips via GET /:id', async () => {
    // Two forward-compat fields baked into this body keep the test
    // green across the cumulative chain:
    //   - manufacturerId: ignored on solution/02, required from
    //     solution/04 onward (validation pipe).
    //   - x-api-key header: ignored on solution/02..05, required
    //     from solution/06 onward (ApiKeyGuard).
    const create = await request(app.getHttpServer())
      .post('/vehicles')
      .set('x-api-key', 'pit-pass')
      .send({
        make: 'Mini',
        model: 'Cooper',
        year: 2020,
        vin: 'WMWXM5C50K2T12345',
        mileageKm: 42000,
        manufacturerId: 'MFR003',
      })
      .expect(201);
    expect(typeof create.body.id).toBe('string');
    expect(create.body.id).toMatch(/^V\d{3}$/);

    const fetched = await request(app.getHttpServer())
      .get(`/vehicles/${create.body.id}`)
      .expect(200);
    expect(fetched.body.make).toBe('Mini');
    expect(fetched.body.model).toBe('Cooper');
  });

  it('GET /vehicles/:id returns 404 for an unknown id', async () => {
    await request(app.getHttpServer()).get('/vehicles/V999').expect(404);
  });
});
