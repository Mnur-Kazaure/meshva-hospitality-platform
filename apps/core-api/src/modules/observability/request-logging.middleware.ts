import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import { AppRequest } from '../../common/types/request-context';
import { ObservabilityService } from './observability.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly observabilityService: ObservabilityService) {}

  use(request: AppRequest, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const requestId = this.resolveRequestId(request);
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    let completed = false;
    const finish = () => {
      if (completed) {
        return;
      }
      completed = true;

      const elapsedNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(elapsedNs) / 1_000_000;
      const route = this.resolveRoute(request);
      this.observabilityService.logHttpRequest({
        requestId,
        tenantId: request.context?.tenantId ?? this.readHeader(request.headers['x-tenant-id']),
        propertyId: request.context?.propertyId ?? this.resolvePropertyId(request),
        userId: request.context?.userId ?? this.readHeader(request.headers['x-user-id']),
        route,
        method: request.method.toUpperCase(),
        statusCode: response.statusCode,
        durationMs,
        message: `${request.method.toUpperCase()} ${route} completed`,
      });
    };

    response.on('finish', finish);
    response.on('close', finish);
    next();
  }

  private resolveRoute(request: AppRequest): string {
    const routePath = typeof request.route?.path === 'string' ? request.route.path : undefined;
    if (routePath) {
      const base = typeof request.baseUrl === 'string' ? request.baseUrl : '';
      return `${base}${routePath}`;
    }

    const original = request.originalUrl ?? request.url ?? request.path ?? '/';
    const normalized = original.split('?')[0];
    return normalized.length > 0 ? normalized : '/';
  }

  private resolvePropertyId(request: AppRequest): string | undefined {
    const value = request.params?.propertyId;
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    return undefined;
  }

  private resolveRequestId(request: AppRequest): string {
    const headerRequestId = this.readHeader(request.headers['x-request-id']);
    if (headerRequestId && headerRequestId.trim().length <= 128) {
      return headerRequestId.trim();
    }

    if (typeof request.requestId === 'string' && request.requestId.trim().length > 0) {
      return request.requestId;
    }

    return randomUUID();
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }

    return undefined;
  }
}
