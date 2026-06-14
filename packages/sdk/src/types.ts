import type { LogItem } from '@centry/shared';

export type { LogItem };

export interface SdkConfig {
  dsn: string;
  enableLogs?: boolean;
  environment?: string;
  release?: string;
  beforeSendLog?: (log: LogItem) => LogItem | null;
}

export interface ParsedDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

export type ResolvedConfig = ParsedDsn & SdkConfig;

export interface TraceContext {
  traceId: string;
  spanId: string;
}

export interface StackFrame {
  filename: string;
  function: string;
  lineno?: number;
  colno?: number;
}
