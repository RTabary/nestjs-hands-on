import type { Garage } from '../garages/entities/garage.entity';

const SEED_TIMESTAMP = new Date('2026-04-27T00:00:00.000Z');

export const GARAGES_SEED: ReadonlyArray<Garage> = [
  {
    id: 'G001',
    name: 'Pit Stop Garage',
    address: '12 rue du Castellet, 83330 Le Castellet, France',
    mechanicIds: ['MEC001', 'MEC002'],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'G002',
    name: "Doc Brown's Repair",
    address: '1640 Riverside Drive, Hill Valley, CA',
    mechanicIds: ['MEC003'],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'G003',
    name: 'Q-Branch Workshop',
    address: 'Vauxhall Cross, London, UK',
    mechanicIds: ['MEC004', 'MEC005'],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];
