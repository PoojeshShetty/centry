import { logger } from '../core/logger.js';

let patched = false;

export function resetForTest(): void {
  patched = false;
}

export function installGlobalErrors(): void {
  if (patched) return;
  patched = true;

  window.onerror = (message, _source, _lineno, _colno, error) => {
    const msg = typeof message === 'string' ? message : String(message);
    const attrs: Record<string, unknown> = {
      'error.type': error instanceof Error ? error.constructor.name : 'Error',
    };
    logger.fatal(msg, [], attrs);
    return false;
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
    logger.fatal(msg, [], {});
  });
}
