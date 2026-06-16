import type { ResolvedConfig, SdkReactConfig } from '../types.js';
import { parseDsn } from '../utils/parseDsn.js';
import { SDK_NAME } from '../utils/constants.js';
import { randomHex } from '../utils/random.js';
import { installIntegrations } from '../integrations/index.js';

let config: ResolvedConfig | null = null;
let traceId: string | null = null;

export function getTraceId(): string | null {
  return traceId;
}

export function init(options: SdkReactConfig): void {
  if (config !== null) {
    console.warn(`${SDK_NAME}: init() called more than once — ignoring subsequent call`);
    return;
  }

  let parsed;
  try {
    parsed = parseDsn(options.dsn);
  } catch (err) {
    console.error(`${SDK_NAME}: invalid DSN — ${(err as Error).message}`);
    return;
  }

  config = { ...options, ...parsed };
  traceId = randomHex(16);

  if (typeof window !== 'undefined') {
    installIntegrations();
  }
}

export function getConfig(): ResolvedConfig | null {
  return config;
}

export function resetForTest(): void {
  config = null;
  traceId = null;
}
