import { ConflictException } from '@nestjs/common';

/**
 * Fired when transitioning a MaintenanceOrder to "completed" would
 * push any referenced SparePart's stock below zero. Returns HTTP 409.
 */
export class OutOfStockException extends ConflictException {
  constructor(partId: string) {
    super(`SparePart ${partId} is out of stock`);
  }
}
