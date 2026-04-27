import { SetMetadata } from '@nestjs/common';

/**
 * Marks a controller route (or whole controller class) as public —
 * the global ApiKeyGuard from step 06 reads this flag via Reflector
 * and skips the x-api-key check.
 *
 * Usage:
 *   @Public()
 *   @Get('/health')
 *   getHealth() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
