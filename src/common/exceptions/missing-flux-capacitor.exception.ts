import { ConflictException } from '@nestjs/common';

/**
 * Custom domain exception. Fired when a maintenance order on the
 * DeLorean (V009) is transitioned to "completed" but the order's
 * partIds list does NOT contain the flux capacitor (P-FLUX-CAP-MK2).
 *
 * Pedagogically this hangs three things together:
 *   - the seed-data wink (research.md R10),
 *   - the exception-filter teaching moment (this file),
 *   - the unified-error-envelope shape (AllExceptionsFilter).
 *
 * Returns HTTP 409 Conflict.
 */
export class MissingFluxCapacitorException extends ConflictException {
  constructor(vehicleId: string) {
    super(
      `Vehicle ${vehicleId} cannot have a maintenance order completed without P-FLUX-CAP-MK2`,
    );
  }
}
