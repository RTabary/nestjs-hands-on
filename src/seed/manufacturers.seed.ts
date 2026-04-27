import type { Manufacturer } from '../manufacturers/entities/manufacturer.entity';

const SEED_TIMESTAMP = new Date('2026-04-27T00:00:00.000Z');

/**
 * Manufacturer roster — covers every make in the vehicles seed so
 * the Vehicle.manufacturerId FK introduced at step 04 always resolves.
 */
export const MANUFACTURERS_SEED: ReadonlyArray<Manufacturer> = [
  { id: 'MFR001', name: 'Renault',                country: 'FR', foundedYear: 1899, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR002', name: 'Toyota',                 country: 'JP', foundedYear: 1937, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR003', name: 'Ford',                   country: 'US', foundedYear: 1903, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR004', name: 'BMW',                    country: 'DE', foundedYear: 1916, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR005', name: 'Aston Martin',           country: 'GB', foundedYear: 1913, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR006', name: 'DeLorean Motor Company', country: 'US', foundedYear: 1975, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR007', name: 'Reliant',                country: 'GB', foundedYear: 1935, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR008', name: 'Tesla',                  country: 'US', foundedYear: 2003, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MFR009', name: 'Smart',                  country: 'DE', foundedYear: 1994, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
];
