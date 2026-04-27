import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';
import { SeedService } from '../seed/seed.service';
import { SPARE_PARTS_SEED } from '../seed/spare-parts.seed';
import { SparePart } from './entities/spare-part.entity';
import { SparePartsService } from './spare-parts.service';

/**
 * Step 08's unit-test exemplar — refactored at step S2 (Persistence)
 * to mock the TypeORM Repository<SparePart> instead of the
 * Map-backed SeedService that the service used pre-stretch.
 *
 * Demonstrates the Test.createTestingModule pattern at its smallest:
 * build a module that contains ONLY the service under test plus its
 * dependencies, all replaced by minimal stubs.
 */
describe('SparePartsService (unit)', () => {
  let service: SparePartsService;
  // In-memory map standing in for the SQLite-backed repository.
  let store: Map<string, SparePart>;

  beforeEach(async () => {
    store = new Map();
    // Pre-populate with the seed roster — same shape as the file-based
    // run after onModuleInit's idempotent reseed.
    for (const part of SPARE_PARTS_SEED) store.set(part.id, { ...part });

    const repoMock: Partial<Repository<SparePart>> = {
      find: jest.fn(async (opts?: { order?: unknown; take?: number }) => {
        const all = [...store.values()];
        if (opts?.take === 1) {
          return all.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 1);
        }
        return all;
      }) as never,
      findOneBy: jest.fn(async ({ id }: { id: string }) =>
        store.get(id) ?? null,
      ) as never,
      count: jest.fn(async () => store.size) as never,
      create: jest.fn((data: SparePart) => data) as never,
      save: jest.fn(async (data: SparePart | SparePart[]) => {
        const arr = Array.isArray(data) ? data : [data];
        for (const item of arr) store.set(item.id, item);
        return data;
      }) as never,
      delete: jest.fn(async (id: string) => ({
        affected: store.delete(id) ? 1 : 0,
      })) as never,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparePartsService,
        { provide: getRepositoryToken(SparePart), useValue: repoMock },
        {
          provide: SeedService,
          useValue: { has: () => true, get: () => SPARE_PARTS_SEED },
        },
      ],
    }).compile();

    service = module.get(SparePartsService);
    // Don't call onModuleInit() — store is pre-populated above and
    // onModuleInit's "table empty?" check would skip reseeding anyway.
  });

  it('findOne returns a seeded part by id', async () => {
    const flux = await service.findOne('P020');
    expect(flux.partNumber).toBe('FLUX-CAP-MK2');
    expect(flux.priceEur).toBe(88_888.88);
  });

  it('findOne throws NotFoundException for an unknown id', async () => {
    await expect(service.findOne('P999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findAll returns at least the seed roster', async () => {
    const all = await service.findAll();
    expect(all.length).toBeGreaterThanOrEqual(20);
  });

  it('decrementStock reduces stock by 1', async () => {
    const before = (await service.findOne('P017')).stock;
    await service.decrementStock('P017');
    expect((await service.findOne('P017')).stock).toBe(before - 1);
  });

  it('decrementStock floors at 0 (never goes negative)', async () => {
    // P020 (flux capacitor) starts with stock=1.
    expect((await service.findOne('P020')).stock).toBe(1);
    await service.decrementStock('P020');
    expect((await service.findOne('P020')).stock).toBe(0);
    await service.decrementStock('P020');
    expect((await service.findOne('P020')).stock).toBe(0);
  });
});
