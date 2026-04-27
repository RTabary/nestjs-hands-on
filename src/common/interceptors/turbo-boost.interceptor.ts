import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * TurboBoostInterceptor — measures wall-clock duration of each
 * request and surfaces it both:
 *   1. as the `X-Response-Time: <n>ms` header on every response, and
 *   2. as a Logger line: `[TurboBoost] GET /vehicles → 12ms`.
 *
 * Stretch S1's teaching surface: NestJS interceptors wrap the
 * handler's response stream via RxJS, so they can run code BEFORE
 * the handler (here: capture the start time) and AFTER (here: emit
 * the timing in `tap`). The `tap` callback fires before the response
 * is serialised to the wire, so `res.setHeader(...)` lands in the
 * outgoing payload.
 *
 * .NET parallel: closest equivalent is an `IActionFilter` /
 * `IAsyncActionFilter` with `OnActionExecuting` (start time) +
 * `OnActionExecuted` (set the header). Distinct from middleware in
 * that NestJS interceptors are reactive (Observable) rather than
 * imperative — see the step markdown for the full mapping.
 */
@Injectable()
export class TurboBoostInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TurboBoostInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const start = Date.now();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const stamp = `${duration}ms`;
        // setHeader fires before NestJS serialises the response, so
        // the header is included in the outgoing payload.
        res.setHeader('X-Response-Time', stamp);
        this.logger.log(`${req.method} ${req.url} → ${stamp}`);
      }),
    );
  }
}
