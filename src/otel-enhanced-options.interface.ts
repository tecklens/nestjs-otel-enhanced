// src/otel-enhanced-options.interface.ts
import {DiagLogLevel} from "@opentelemetry/api/build/src/diag/types";

export interface OtelEnhancedOptions {
  urlCollector: string;
  serviceName: string;
  serviceVersion: string;
  apiKey: string; // nếu cần dùng cho exporter custom
  logLevel?: DiagLogLevel;
  ignoreUrls?: RegExp[];

  traceExceptions?: boolean; // default: true
  logExceptions?: boolean; // optional: log ra console
}
