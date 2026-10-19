import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { DomainError } from '@globeguide/domain';

type ErrorResponse = {
  code: string;
  messageKey: string;
  requestId: string;
  details?: unknown;
};

@Catch()
@Injectable()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const rawResponse = context.getResponse();
    const requestId = String(request.headers['x-request-id'] ?? crypto.randomUUID());

    const errorResponse = this.toResponse(exception, requestId);
    const reply = rawResponse as {
      header?: (name: string, value: string) => unknown;
      status?: (statusCode: number) => { send: (body: unknown) => unknown };
      raw?: { setHeader?: (name: string, value: string) => void; statusCode?: number; end?: (body: string) => void };
      setHeader?: (name: string, value: string) => void;
      statusCode?: number;
      end?: (body: string) => void;
    };

    if (reply.header && reply.status) {
      reply.header('x-request-id', requestId);
      reply.status(errorResponse.status).send(errorResponse.body);
      return;
    }

    const raw = reply.raw ?? reply;
    raw.setHeader?.('x-request-id', requestId);
    raw.statusCode = errorResponse.status;
    raw.end?.(JSON.stringify(errorResponse.body));
  }

  private toResponse(
    exception: unknown,
    requestId: string,
  ): { status: number; body: ErrorResponse } {
    if (exception instanceof DomainError) {
      return {
        status: exception.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
        body: {
          code: exception.code,
          messageKey: exception.messageKey,
          requestId,
          ...(exception.details ? { details: exception.details } : {}),
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: {
          code: `HTTP_${status}`,
          messageKey: 'errors.http_request_failed',
          requestId,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        messageKey: 'errors.internal',
        requestId,
      },
    };
  }
}
