import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app.factory';

/**
 * Step S2 — Persistence (TypeORM + SQLite) checkpoint test.
 *
 * Proves the workshop's "aha" moment: data survives a server restart
 * once the Map-backed services are swapped for TypeORM repositories
 * pointed at a file-backed SQLite database.
 *
 * The test points the app at `data/workshop.s2-test.sqlite` via the
 * WORKSHOP_DB env var (read by AppConfigService.getDatabasePath).
 * The default test path is `:memory:`, which would NOT survive a
 * close/re-init cycle — so we override before the first boot.
 */
const DB_PATH = 'data/workshop.s2-test.sqlite';

describe('Stretch S2 — Persistence (e2e)', () => {
  let app: INestApplication;
  let createdVehicleId: string;

  beforeAll(async () => {
    // Make sure parent dir exists (TypeORM's synchronize: true
    // will create the schema; sqlite3 won't create the directory).
    mkdirSync(dirname(DB_PATH), { recursive: true });
    if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
    process.env.WORKSHOP_DB = DB_PATH;

    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
    delete process.env.WORKSHOP_DB;
  });

  it('seeds the roster on first boot (≥ 12 vehicles, ≥ 20 spare-parts)', async () => {
    const vehicles = await request(app.getHttpServer())
      .get('/vehicles')
      .expect(200);
    expect(vehicles.body.length).toBeGreaterThanOrEqual(12);

    const parts = await request(app.getHttpServer())
      .get('/spare-parts')
      .expect(200);
    expect(parts.body.length).toBeGreaterThanOrEqual(20);

    // Sanity-check the flux-capacitor seed survived the JSON
    // round-trip with its decimal price intact (REAL column type).
    const flux = (parts.body as Array<{ partNumber: string; priceEur: number }>)
      .find((p) => p.partNumber === 'FLUX-CAP-MK2');
    expect(flux).toBeDefined();
    expect(flux!.priceEur).toBeCloseTo(88_888.88, 2);
  });

  it('a vehicle inserted before close() is still readable after re-init (the persistence "aha")', async () => {
    // 1. Create a fresh vehicle.
    const create = await request(app.getHttpServer())
      .post('/vehicles')
      .set('x-api-key', 'pit-pass')
      .send({
        make: 'Ariel',
        model: 'Atom 4',
        year: 2023,
        vin: 'GBARLATM4S2D54321',
        mileageKm: 1_200,
        manufacturerId: 'MFR005',
      })
      .expect(201);
    createdVehicleId = create.body.id as string;

    // 2. Tear down the app entirely.
    await app.close();

    // 3. Boot a brand-new app pointed at the same DB file.
    app = await createTestApp();

    // 4. The Ariel Atom should still be there — proof the data
    //    survived the restart (the whole point of step S2).
    const fetched = await request(app.getHttpServer())
      .get(`/vehicles/${createdVehicleId}`)
      .expect(200);
    expect(fetched.body.make).toBe('Ariel');
    expect(fetched.body.model).toBe('Atom 4');
  });
});
