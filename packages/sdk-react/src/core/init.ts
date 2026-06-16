import type { ResolvedConfig, SdkReactConfig } from '../types.js';
import { parseDsn } from '../utils/parseDsn.js';
import { SDK_NAME } from '../utils/constants.js';

let config: ResolvedConfig | null = null;

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
}

export function getConfig(): ResolvedConfig | null {
  return config;
}

export function resetForTest(): void {
  config = null;
}
