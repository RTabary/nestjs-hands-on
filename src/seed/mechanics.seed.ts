import type { Mechanic } from '../mechanics/entities/mechanic.entity';

const SEED_TIMESTAMP = new Date('2026-04-27T00:00:00.000Z');

export const MECHANICS_SEED: ReadonlyArray<Mechanic> = [
  { id: 'MEC001', firstName: 'Alice', lastName: 'Bertrand', specialty: 'engine',     garageId: 'G001', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MEC002', firstName: 'Diego', lastName: 'Marín',    specialty: 'general',    garageId: 'G001', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MEC003', firstName: 'Priya', lastName: 'Iyer',     specialty: 'electrical', garageId: 'G002', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MEC004', firstName: 'Marco', lastName: 'Rossi',    specialty: 'body',       garageId: 'G003', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'MEC005', firstName: 'Yuki',  lastName: 'Tanaka',   specialty: 'engine',     garageId: 'G003', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
];
