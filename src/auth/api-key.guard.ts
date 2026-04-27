import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { IS_PUBLIC_KEY } from './public.decorator';

const API_KEY_HEADER = 'x-api-key';

/**
 * Global ApiKeyGuard.
 *
 * Reflector reads the @Public() metadata from the route handler OR
 * its controller class. If the route opts out, the guard returns
 * true unconditionally. Otherwise it checks the x-api-key header
 * against AppConfigService's configured key.
 *
 * Step 06 (where this guard was introduced) used a hard-coded
 * constant. Step 07 relocates that to .env via AppConfigService —
 * the change is invisible to clients but follows the same pattern
 * IConfiguration / IOptions<T> serves in ASP.NET Core.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly appConfig: AppConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[API_KEY_HEADER];
    if (provided === this.appConfig.getApiKey()) return true;

    throw new UnauthorizedException('Missing or invalid x-api-key header');
  }
}
