import type { ResolvedConfig, SdkConfig } from './types.js';
import { parseDsn } from './utils/parseDsn.js';

let config: ResolvedConfig | null = null;

export function init(options: SdkConfig): void {
  if (config !== null) {
    console.warn('@centry/sdk: init() called more than once — ignoring subsequent call');
    return;
  }
  const parsed = parseDsn(options.dsn);
  config = { ...options, ...parsed };
}

export function getConfig(): ResolvedConfig {
  if (config === null) {
    throw new Error('call init() before using logger');
  }
  return config;
}
