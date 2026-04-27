import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

/**
 * AuthModule houses the workshop's authorization primitives.
 * NestJS's Reflector is provided by core — no need to register it
 * explicitly. ApiKeyGuard is exported so AppModule can register it
 * via APP_GUARD as a global guard.
 */
@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
