import { logger } from '../core/logger.js';
import { CENTRY_ENVELOPE_URL } from '../utils/constants.js';

let patched = false;
let savedFetch: typeof globalThis.fetch | null = null;

export function resetForTest(): void {
  patched = false;
  if (savedFetch !== null && typeof window !== 'undefined') {
    window.fetch = savedFetch;
    savedFetch = null;
  }
}

export function installFetch(): void {
  if (patched) return;
  if (typeof window === 'undefined' || typeof window.fetch === 'undefined') return;
  patched = true;

  savedFetch = window.fetch.bind(window);
  const originalFetch = savedFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url === CENTRY_ENVELOPE_URL) return originalFetch(input, init);

    const start = Date.now();
    const response = await originalFetch(input, init);

    const durationMs = Date.now() - start;
    const attrs = {
      'http.method': method,
      'http.url': url,
      'http.status_code': response.status,
      'http.duration_ms': durationMs,
    };

    if (response.status >= 400 || !response.ok) {
      logger.error(`HTTP ${method} ${url} ${response.status}`, [], attrs);
    } else {
      logger.info(`HTTP ${method} ${url} ${response.status}`, [], attrs);
    }

    return response;
  };
}
