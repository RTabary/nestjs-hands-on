import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

/**
 * Step 07's checkpoint test asserts that the maintenance-orders queue
 * limit is enforced — a config-driven business rule introduced when
 * @nestjs/config + AppConfigService land. The default limit (per
 * .env.example) is 10.
 *
 * On A6 (no queue limit logic): every POST succeeds.
 * On A7 (queue limit enforced): once the seeded `queued` count + new
 * orders exceeds the limit, POST returns 409 MaintenanceQueueFullException.
 */
describe('Step 07 — Configuration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exceeding MAINTENANCE_QUEUE_LIMIT returns 409', async () => {
    // Post enough fresh orders that, combined with whatever is in the
    // seeded queue, we exceed the limit. The default limit is 10.
    let sawQueueFull = false;
    for (let i = 0; i < 30; i++) {
      const res = await request(app.getHttpServer())
        .post('/maintenance-orders')
        .set('x-api-key', 'pit-pass')
        .send({
          vehicleId: 'V001',
          mechanicId: 'MEC001',
          partIds: [],
          scheduledFor: '2026-12-31T09:00:00.000Z',
        });
      if (res.status === 409 && /queue/i.test(JSON.stringify(res.body))) {
        sawQueueFull = true;
        break;
      }
    }
    expect(sawQueueFull).toBe(true);
  });
});
