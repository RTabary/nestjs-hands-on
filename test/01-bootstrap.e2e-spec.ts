import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Step 01 — Bootstrap & Modules (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
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
