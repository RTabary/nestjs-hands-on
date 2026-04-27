import { Column, Entity, PrimaryColumn } from 'typeorm';

export type MaintenanceStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

@Entity('maintenance_orders')
export class MaintenanceOrder {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  mechanicId!: string;

  @Column({ type: 'simple-array' })
  partIds!: string[];

  @Column({ type: 'datetime' })
  scheduledFor!: Date;

  @Column({ type: 'varchar' })
  status!: MaintenanceStatus;

  @Column({ type: 'varchar', nullable: true })
  notes?: string;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
