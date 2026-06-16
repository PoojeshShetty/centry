import { logger } from '../core/logger.js';

let patched = false;

export function resetForTest(): void {
  patched = false;
  XMLHttpRequest.prototype.open = originalOpen;
}

const originalOpen = XMLHttpRequest.prototype.open;

export function installXhr(): void {
  if (patched) return;
  if (typeof window === 'undefined') return;
  patched = true;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: [boolean?, string?, string?]
  ) {
    this.__centry_method = method.toUpperCase();
    this.__centry_url = typeof url === 'string' ? url : url.href;

    this.addEventListener('loadend', () => {
      const status = this.status;
      const attrs = {
        'http.method': this.__centry_method as string,
        'http.url': this.__centry_url as string,
        'http.status_code': status,
      };

      if (status === 0 || status >= 400) {
        logger.error(`HTTP ${this.__centry_method} ${this.__centry_url} ${status}`, [], attrs);
      } else {
        logger.info(`HTTP ${this.__centry_method} ${this.__centry_url} ${status}`, [], attrs);
      }
    });

    const [async = true, ...userPass] = rest;
    return originalOpen.call(this, method, url, async, ...userPass);
  };
}

declare global {
  interface XMLHttpRequest {
    __centry_method?: string;
    __centry_url?: string;
  }
}
