import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from '../seed/seed.service';
import { SPARE_PARTS_SEED } from '../seed/spare-parts.seed';
import { SparePartsService } from './spare-parts.service';

/**
 * Step 08's unit-test exemplar. Demonstrates the
 * Test.createTestingModule pattern at its smallest: build a module
 * that contains ONLY the service under test plus any dependencies
 * (here just SeedService, mocked so we don't pull the real one in).
 *
 * No HTTP server, no AppModule, no controllers — fast feedback
 * (single-millisecond per case) and crystal-clear failure attribution.
 */
describe('SparePartsService (unit)', () => {
  let service: SparePartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparePartsService,
        // Hand-rolled mock of SeedService — only the two methods
        // SparePartsService actually calls. .NET/.NET Core devs:
        // this is the equivalent of registering a stub
        // implementation of an interface in your test fixture.
        {
          provide: SeedService,
          useValue: {
            has: () => true,
            get: () => SPARE_PARTS_SEED,
          },
        },
      ],
    }).compile();

    service = module.get(SparePartsService);
    service.onModuleInit();
  });

  it('findOne returns a seeded part by id', () => {
    const flux = service.findOne('P020');
    expect(flux.partNumber).toBe('FLUX-CAP-MK2');
    expect(flux.priceEur).toBe(88_888.88);
  });

  it('findOne throws NotFoundException for an unknown id', () => {
    expect(() => service.findOne('P999')).toThrow(NotFoundException);
  });

  it('findAll returns at least the seed roster', () => {
    expect(service.findAll().length).toBeGreaterThanOrEqual(20);
  });

  it('decrementStock reduces stock by 1', () => {
    const before = service.findOne('P017').stock;
    service.decrementStock('P017');
    expect(service.findOne('P017').stock).toBe(before - 1);
  });

  it('decrementStock floors at 0 (never goes negative)', () => {
    // P020 (flux capacitor) starts with stock=1.
    expect(service.findOne('P020').stock).toBe(1);
    service.decrementStock('P020');
    expect(service.findOne('P020').stock).toBe(0);
    service.decrementStock('P020');
    expect(service.findOne('P020').stock).toBe(0);
  });
});
