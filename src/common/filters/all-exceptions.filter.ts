import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface UnifiedErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Global exception filter — wraps every uncaught error in the
 * unified envelope:
 *   { statusCode, error, message, timestamp, path }
 *
 * For HttpException subclasses (NotFoundException, BadRequestException,
 * the workshop's MissingFluxCapacitorException, etc.) we extract the
 * status + body from the exception. For everything else we default to
 * 500 Internal Server Error.
 *
 * The `error` field follows HTTP-status-name convention (e.g.,
 * "Not Found", "Conflict") so it's machine-readable.
 *
 * Validation errors (from class-validator via ValidationPipe) come
 * through as HttpException with response = { message: string[], ... }.
 * We preserve the array message — useful for clients to surface
 * multiple field-level errors at once.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = HttpStatus[status] ?? 'Error';
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message =
          (obj.message as string | string[] | undefined) ?? exception.message;
        error =
          (obj.error as string | undefined) ?? HttpStatus[status] ?? 'Error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack ?? exception.message);
    }

    const envelope: UnifiedErrorBody = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(envelope);
  }
}
