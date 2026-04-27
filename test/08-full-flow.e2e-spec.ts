import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

/**
 * Step 08's e2e-test exemplar — a full user journey that touches
 * vehicles, maintenance orders, the transition state machine, the
 * exception filter, and the stock-decrement side effect from step 05.
 *
 * Unlike a per-step checkpoint test (which usually exercises one
 * concept), this one demonstrates the "integration test" shape an
 * attendee would use to guard a critical user flow against
 * regressions across releases.
 */
describe('Step 08 — Full flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a vehicle, runs a maintenance order to completion, and decrements stock', async () => {
    const apiKey = { 'x-api-key': 'pit-pass' };

    // 1. Create a fresh vehicle so we don't disturb the seed.
    const vehicle = await request(app.getHttpServer())
      .post('/vehicles')
      .set(apiKey)
      .send({
        make: 'Mini',
        model: 'Cooper S',
        year: 2022,
        vin: 'WMWXM5C50K2T54321',
        mileageKm: 18_000,
        manufacturerId: 'MFR004',
      })
      .expect(201);

    // 2. Capture the current stock of a part we'll use.
    const partBefore = await request(app.getHttpServer())
      .get('/spare-parts/P017')
      .expect(200);
    const stockBefore: number = partBefore.body.stock;

    // 3. Create a maintenance order on the new vehicle, with that
    //    part attached.
    const order = await request(app.getHttpServer())
      .post('/maintenance-orders')
      .set(apiKey)
      .send({
        vehicleId: vehicle.body.id,
        mechanicId: 'MEC001',
        partIds: ['P017'],
        scheduledFor: '2026-12-31T09:00:00.000Z',
      })
      .expect(201);
    expect(order.body.status).toBe('queued');

    // 4. Walk the state machine: queued → in_progress → completed.
    await request(app.getHttpServer())
      .post(`/maintenance-orders/${order.body.id}/transition`)
      .set(apiKey)
      .send({ status: 'in_progress' })
      .expect(200);
    const final = await request(app.getHttpServer())
      .post(`/maintenance-orders/${order.body.id}/transition`)
      .set(apiKey)
      .send({ status: 'completed' })
      .expect(200);
    expect(final.body.status).toBe('completed');

    // 5. The completion side effect: P017's stock decremented by 1.
    const partAfter = await request(app.getHttpServer())
      .get('/spare-parts/P017')
      .expect(200);
    expect(partAfter.body.stock).toBe(stockBefore - 1);
  });

  it('rejects an illegal transition (queued → completed) with 400 in the unified envelope', async () => {
    const apiKey = { 'x-api-key': 'pit-pass' };

    const vehicle = await request(app.getHttpServer())
      .post('/vehicles')
      .set(apiKey)
      .send({
        make: 'Smart',
        model: 'EQ',
        year: 2023,
        vin: 'WMEEJ9AAXEK999999',
        mileageKm: 5_000,
        manufacturerId: 'MFR009',
      })
      .expect(201);

    const order = await request(app.getHttpServer())
      .post('/maintenance-orders')
      .set(apiKey)
      .send({
        vehicleId: vehicle.body.id,
        mechanicId: 'MEC002',
        partIds: [],
        scheduledFor: '2026-12-31T09:00:00.000Z',
      })
      .expect(201);

    const illegal = await request(app.getHttpServer())
      .post(`/maintenance-orders/${order.body.id}/transition`)
      .set(apiKey)
      .send({ status: 'completed' })
      .expect(400);

    // The unified error envelope from step 05's filter:
    expect(illegal.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(illegal.body.message).toMatch(/Illegal transition/i);
  });
});
