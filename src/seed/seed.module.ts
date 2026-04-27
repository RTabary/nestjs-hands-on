import { Global, Module } from '@nestjs/common';
import { SeedService } from './seed.service';

/**
 * Global seed-registry module.
 *
 * Marked @Global so per-entity modules (introduced step-by-step) can
 * inject SeedService without each one having to import SeedModule.
 * Useful for a workshop where attendees should not have to wire
 * cross-cutting infrastructure to make their feature work.
 */
@Global()
@Module({
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
