import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

/**
 * PitCrewModule — the workshop's authorization primitives, named in
 * keeping with the cars/auto-parts theme (a Pit Crew lets you in or
 * stops you at the pit lane). Functionally identical to a stock
 * AuthModule.
 *
 * NestJS's Reflector is provided by core — no need to register it
 * explicitly. ApiKeyGuard is exported so AppModule can register it
 * via APP_GUARD as a global guard.
 */
@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class PitCrewModule {}
