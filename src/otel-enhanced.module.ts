// src/otel-enhanced.module.ts
import {DynamicModule, Global, Module, Provider} from '@nestjs/common';
import {OtelEnhancedOptions} from './otel-enhanced-options.interface';
import {setupOpenTelemetry} from './otel.setup';
import {APP_INTERCEPTOR, Reflector} from '@nestjs/core';
import {OtelRouteInterceptor} from './otel-route.interceptor';

export const OTEL_ENHANCED_OPTIONS = 'OTEL_ENHANCED_OPTIONS';

@Global()
@Module({})
export class OtelEnhancedModule {
  static forRootAsync(optionsProvider: {
    useFactory: (...args: any[]) => Promise<OtelEnhancedOptions> | OtelEnhancedOptions;
    inject?: any[];
  }): DynamicModule {
    const options: Provider = {
      provide: OTEL_ENHANCED_OPTIONS,
      useFactory: optionsProvider.useFactory,
      inject: optionsProvider.inject || [],
    };

    const sdkProvider: Provider = {
      provide: 'OTEL_SDK',
      useFactory: async (opts: OtelEnhancedOptions) => {
        return setupOpenTelemetry(opts);
      },
      inject: [OTEL_ENHANCED_OPTIONS],
    };

    const filters: Provider[] = [
      options,
      sdkProvider,
      Reflector,
      {
        provide: APP_INTERCEPTOR,
        useFactory: (reflector: Reflector) => new OtelRouteInterceptor(reflector),
        inject: [Reflector],
      },
    ];

    return {
      module: OtelEnhancedModule,
      providers: filters,
      exports: [],
    };
  }
}
