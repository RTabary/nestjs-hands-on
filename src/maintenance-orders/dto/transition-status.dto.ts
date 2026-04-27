import { IsIn } from 'class-validator';
import type { MaintenanceStatus } from '../entities/maintenance-order.entity';

// The state machine only accepts moves to in_progress / completed /
// cancelled — never back to "queued" (that's the initial state at
// creation). The service layer enforces the transition graph.
export type TransitionTarget = Exclude<MaintenanceStatus, 'queued'>;

export class TransitionStatusDto {
  @IsIn(['in_progress', 'completed', 'cancelled'])
  status!: TransitionTarget;
}
