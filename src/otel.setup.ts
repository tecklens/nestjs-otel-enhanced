import {NodeSDK} from '@opentelemetry/sdk-node';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from '@opentelemetry/semantic-conventions';
import {Resource} from '@opentelemetry/resources';
import {NestInstrumentation} from '@opentelemetry/instrumentation-nestjs-core';
import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
import {OtelEnhancedOptions} from "./otel-enhanced-options.interface";
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import {Instrumentation} from "@opentelemetry/instrumentation";

// (Tuỳ chọn) bật logging debug của OpenTelemetry để debug khi cần

export function setupOpenTelemetry(options: OtelEnhancedOptions) {
  diag.setLogger(new DiagConsoleLogger(), options.logLevel ?? DiagLogLevel.INFO);
  const {serviceName, serviceVersion, apiKey, urlCollector} = options;
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  });

  let instrumentations: (Instrumentation | Instrumentation[])[] = [
    new NestInstrumentation(),
    getNodeAutoInstrumentations({
      // Optional: cấu hình nếu muốn exclude gì đó
    }),
  ]

  if (options.ignoreUrls && options.ignoreUrls.length > 0) {
    instrumentations.push(new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) => (options.ignoreUrls ?? []).some((regex) => req.url && regex.test(req.url)),
    }))
  }

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: urlCollector, // hoặc dùng Jaeger nếu cần
      headers: {
        'x-api-key': `ApiKey${apiKey}`,
      },
    }),
    serviceName: serviceName,
    resource,
    instrumentations,
  });

  sdk.start();

  return sdk;
}
