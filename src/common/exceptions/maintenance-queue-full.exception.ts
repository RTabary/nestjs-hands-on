import { ConflictException } from '@nestjs/common';

/**
 * Fired when a new maintenance order would push the count of
 * 'queued' orders past MAINTENANCE_QUEUE_LIMIT (configured via the
 * env var of the same name; default 10). Returns HTTP 409.
 */
export class MaintenanceQueueFullException extends ConflictException {
  constructor(limit: number) {
    super(`Maintenance queue is full (limit ${limit})`);
  }
}
