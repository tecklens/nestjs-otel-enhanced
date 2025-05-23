import {CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor,} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {catchError, Observable} from 'rxjs';
import {context, SpanStatusCode, trace} from '@opentelemetry/api';
import {PATH_METADATA} from '@nestjs/common/constants';

@Injectable()
export class OtelRouteInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(apiContext: ExecutionContext, next: CallHandler): Observable<any> {
    try {
      const otelContext = context.active();
      const span = trace.getSpan(otelContext);
      if (!span || apiContext.getType() !== 'http') return next.handle();

      const req = apiContext.switchToHttp().getRequest();

      const controller = apiContext.getClass();
      const handler = apiContext.getHandler();

      // Lấy đường dẫn từ metadata
      const controllerPath = this.reflector.get<string>(
        PATH_METADATA,
        controller,
      ) ?? '';
      const handlerPath = this.reflector.get<string>(
        PATH_METADATA,
        handler,
      ) ?? '';

      const fullRoute = `/${[controllerPath, handlerPath]
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/')}`; // Ghép lại và chuẩn hóa

      span.setAttribute('http.route', fullRoute);
    } catch (e: any) {
      Logger.debug(e?.message)
      console.log(e);
    }

    return next.handle().pipe(
      catchError((err) => {
        const span = trace.getActiveSpan();
        if (span) {
          // Ghi exception vào span
          span.recordException({
            name: err?.name || 'Error',
            message: err?.message || 'Unhandled exception',
            stack: err?.stack,
          });

          // Ghi status lỗi
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err?.message,
          });

          // Ghi attribute tùy ý
          span.setAttribute('exception.type', err?.name || 'Error');
          span.setAttribute('exception.message', err?.message || 'unknown');
        }

        throw err;
      }),
    );
  }
}
