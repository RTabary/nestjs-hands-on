import type { MaintenanceOrder } from '../maintenance-orders/entities/maintenance-order.entity';

const SEED_TIMESTAMP = new Date('2026-04-27T00:00:00.000Z');

/**
 * Initial maintenance-order roster. Six entries:
 *   - one queued for the Renault Clio (V001) (oil + filter swap)
 *   - one in-progress for the Toyota Corolla (V002) (brake job)
 *   - one completed for the BMW i3 (V007)
 *   - three (yes, three — the wink) completed orders for the Reliant
 *     Robin (V010) within a 2-month window. Driver clearly has issues.
 */
export const MAINTENANCE_ORDERS_SEED: ReadonlyArray<MaintenanceOrder> = [
  {
    id: 'MO001',
    vehicleId: 'V001',
    mechanicId: 'MEC001',
    partIds: ['P001', 'P002'],
    scheduledFor: new Date('2026-05-12T10:00:00.000Z'),
    status: 'queued',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'MO002',
    vehicleId: 'V002',
    mechanicId: 'MEC002',
    partIds: ['P006', 'P007'],
    scheduledFor: new Date('2026-05-08T09:00:00.000Z'),
    status: 'in_progress',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'MO003',
    vehicleId: 'V007',
    mechanicId: 'MEC003',
    partIds: ['P013'],
    scheduledFor: new Date('2026-04-15T14:00:00.000Z'),
    status: 'completed',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  // Reliant Robin's three completed orders — the wink.
  {
    id: 'MO004',
    vehicleId: 'V010',
    mechanicId: 'MEC004',
    partIds: ['P019'],
    scheduledFor: new Date('2026-03-04T08:00:00.000Z'),
    status: 'completed',
    notes: 'Tipped over while parking. Again.',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'MO005',
    vehicleId: 'V010',
    mechanicId: 'MEC005',
    partIds: ['P019', 'P016'],
    scheduledFor: new Date('2026-03-22T08:00:00.000Z'),
    status: 'completed',
    notes: 'Three-wheeled cornering: 1, Bumper: 0.',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'MO006',
    vehicleId: 'V010',
    mechanicId: 'MEC004',
    partIds: ['P008'],
    scheduledFor: new Date('2026-04-18T08:00:00.000Z'),
    status: 'completed',
    notes: 'Brake fluid keeps... finding new ground.',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];
