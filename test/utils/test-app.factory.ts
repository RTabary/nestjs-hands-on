import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

/**
 * Boots the full application against the real AppModule so checkpoint
 * tests exercise the same wiring an attendee would see at runtime
 * (FR-017's "no mocking of NestJS internals — only the public HTTP
 * surface").
 *
 * Returned app is already `init()`-ed; callers must `app.close()` in
 * `afterAll` to release ports.
 *
 * Each `*.e2e-spec.ts` should look like:
 *
 *   let app: INestApplication;
 *   beforeAll(async () => { app = await createTestApp(); });
 *   afterAll(async () => { await app.close(); });
 *   it('GET /vehicles ...', () => request(app.getHttpServer()).get(...))
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
