import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

describe('Step 05 — Exception Filters (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /vehicles/V999 returns the unified error envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles/V999')
      .expect(404);
    // Step 05 introduces the global AllExceptionsFilter that wraps
    // every error in this shape:
    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/vehicles/V999',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('flux-capacitor exception fires on DeLorean maintenance completion without P-FLUX-CAP-MK2', async () => {
    // Create a maintenance order on V009 (DeLorean) without the
    // required part, then attempt to transition it to completed.
    // Step 05 introduces the maintenance-orders endpoint plus the
    // MissingFluxCapacitorException — both green by A5.
    //
    // The x-api-key header is forward-compatible: ignored on
    // solution/05 (no guard yet), required from solution/06 onward.
    const create = await request(app.getHttpServer())
      .post('/maintenance-orders')
      .set('x-api-key', 'pit-pass')
      .send({
        vehicleId: 'V009',
        mechanicId: 'MEC001',
        partIds: [],
        scheduledFor: '2026-12-31T09:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/maintenance-orders/${create.body.id}/transition`)
      .set('x-api-key', 'pit-pass')
      .send({ status: 'in_progress' })
      .expect(200);

    const completion = await request(app.getHttpServer())
      .post(`/maintenance-orders/${create.body.id}/transition`)
      .set('x-api-key', 'pit-pass')
      .send({ status: 'completed' })
      .expect(409);

    expect(completion.body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
    });
    expect(completion.body.message).toContain('FLUX-CAP-MK2');
  });
});
