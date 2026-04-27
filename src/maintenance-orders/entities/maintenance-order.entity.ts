export type MaintenanceStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export class MaintenanceOrder {
  id!: string;
  vehicleId!: string;
  mechanicId!: string;
  partIds!: string[];
  scheduledFor!: Date;
  status!: MaintenanceStatus;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
