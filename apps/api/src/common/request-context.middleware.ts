import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: FastifyRequest, reply: FastifyReply, next: () => void): void {
    const requestId = String(request.headers['x-request-id'] ?? crypto.randomUUID());
    request.headers['x-request-id'] = requestId;
    const response = reply as unknown as {
      header?: (name: string, value: string) => unknown;
      raw?: { setHeader?: (name: string, value: string) => void };
      setHeader?: (name: string, value: string) => void;
    };
    if (response.header) {
      response.header('x-request-id', requestId);
    } else if (response.raw?.setHeader) {
      response.raw.setHeader('x-request-id', requestId);
    } else {
      response.setHeader?.('x-request-id', requestId);
    }
    next();
  }
}
