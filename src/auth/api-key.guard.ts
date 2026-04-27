import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Step 06: hard-coded API key. Step 07 relocates this to the
 * ConfigService so the value lives in .env.
 */
export const WORKSHOP_API_KEY = 'pit-pass';
const API_KEY_HEADER = 'x-api-key';

/**
 * Global ApiKeyGuard.
 *
 * Reflector reads the @Public() metadata from the route handler OR
 * its controller class. If the route opts out, the guard returns
 * true unconditionally. Otherwise it checks the x-api-key header
 * against the workshop's constant.
 *
 * .NET parallel: this is the moral equivalent of a custom
 * AuthorizationHandler + an [Authorize] policy. NestJS guards run
 * in the request lifecycle BEFORE pipes (so before validation) —
 * different ordering from .NET, where authorisation runs after model
 * binding.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[API_KEY_HEADER];
    if (provided === WORKSHOP_API_KEY) return true;

    throw new UnauthorizedException('Missing or invalid x-api-key header');
  }
}
