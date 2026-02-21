import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';
import { IDEMPOTENT_OPERATION_KEY } from '../constants';
import { AppRequest } from '../types/request-context';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../../modules/persistence/repositories/front-desk.repository';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_OPERATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isIdempotent) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<AppRequest>();
    const response = http.getResponse();
    const rawIdempotencyKey = request.headers['idempotency-key'];
    const propertyIdParam = request.params?.propertyId;
    const propertyId = Array.isArray(propertyIdParam) ? propertyIdParam[0] : propertyIdParam;

    if (typeof rawIdempotencyKey !== 'string' || rawIdempotencyKey.trim().length === 0) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const cacheKey = this.repository.buildIdempotencyCacheKey({
      tenantId: request.context.tenantId,
      propertyId,
      userId: request.context.userId,
      method: request.method,
      path: request.route?.path ?? request.path,
      idempotencyKey: rawIdempotencyKey,
    });

    return from(this.repository.getIdempotentResponse(cacheKey)).pipe(
      switchMap((cachedResponse) => {
        if (cachedResponse) {
          response.status(cachedResponse.statusCode);
          return of(cachedResponse.body);
        }

        return next.handle().pipe(
          mergeMap((body) =>
            from(
              this.repository.setIdempotentResponse(cacheKey, {
                statusCode: response.statusCode ?? 200,
                body,
              }),
            ).pipe(switchMap(() => of(body))),
          ),
        );
      }),
    );
  }
}
