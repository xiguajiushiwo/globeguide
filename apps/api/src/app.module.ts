import { Module, RequestMethod } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';

import { HealthModule } from './health/health.module.js';
import { HttpErrorFilter } from './common/http-error.filter.js';
import { RequestContextMiddleware } from './common/request-context.middleware.js';
import { GeographyModule } from './geography/geography.module.js';

@Module({
  imports: [HealthModule, GeographyModule],
  providers: [
    HttpErrorFilter,
    {
      provide: 'HTTP_ERROR_FILTER',
      useExisting: HttpErrorFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
