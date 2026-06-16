import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../core/logger.js', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

import { logger } from '../../core/logger.js';
import { installGlobalErrors, resetForTest as resetGlobalErrors } from '../globalErrors.js';
import { installFetch, resetForTest as resetFetch } from '../fetch.js';
import { installXhr, resetForTest as resetXhr } from '../xhr.js';
import { installNavigation, resetForTest as resetNavigation } from '../navigation.js';

const mockLogger = vi.mocked(logger);

describe('installGlobalErrors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalErrors();
  });

  it('calls logger.fatal when window.onerror fires', () => {
    installGlobalErrors();
    const err = new TypeError('boom');
    window.onerror!('boom', undefined, undefined, undefined, err);
    expect(mockLogger.fatal).toHaveBeenCalledWith('boom', [], { 'error.type': 'TypeError' });
  });

  it('calls logger.fatal with string message when no error object', () => {
    installGlobalErrors();
    window.onerror!('something went wrong');
    expect(mockLogger.fatal).toHaveBeenCalledWith('something went wrong', [], {
      'error.type': 'Error',
    });
  });

  it('calls logger.fatal when unhandledrejection fires with an Error', () => {
    installGlobalErrors();
    const reason = new RangeError('out of range');
    const event = Object.assign(new Event('unhandledrejection'), { reason });
    window.dispatchEvent(event);
    expect(mockLogger.fatal).toHaveBeenCalledWith('out of range', [], {});
  });

  it('calls logger.fatal when unhandledrejection fires with a string', () => {
    installGlobalErrors();
    const event = Object.assign(new Event('unhandledrejection'), { reason: 'raw string' });
    window.dispatchEvent(event);
    expect(mockLogger.fatal).toHaveBeenCalledWith('raw string', [], {});
  });

  it('is idempotent — double install does not double-fire', () => {
    installGlobalErrors();
    installGlobalErrors();
    const err = new Error('once');
    window.onerror!('once', undefined, undefined, undefined, err);
    expect(mockLogger.fatal).toHaveBeenCalledTimes(1);
  });
});

describe('installFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFetch();
  });

  it('logs logger.info for a 2xx response with correct attributes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true }));
    installFetch();

    await window.fetch('https://api/pay', { method: 'POST' });

    expect(mockLogger.info).toHaveBeenCalledOnce();
    const [, , attrs] = mockLogger.info.mock.calls[0];
    expect(attrs).toMatchObject({
      'http.method': 'POST',
      'http.url': 'https://api/pay',
      'http.status_code': 200,
    });
    expect(typeof (attrs as Record<string, unknown>)['http.duration_ms']).toBe('number');
  });

  it('logs logger.error for a 4xx response and still returns the response', async () => {
    const mockResponse = { status: 404, ok: false };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));
    installFetch();

    const result = await window.fetch('https://api/missing', { method: 'GET' });

    expect(mockLogger.error).toHaveBeenCalledOnce();
    expect(result).toBe(mockResponse);
  });

  it('is idempotent — double install does not double-log', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true }));
    installFetch();
    installFetch();

    await window.fetch('https://api/x');

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });
});

describe('installXhr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetXhr();
  });

  const openAndFireLoadend = (method: string, url: string, status: number): Promise<void> =>
    new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.addEventListener('loadend', () => resolve());
      Object.defineProperty(xhr, 'status', { get: () => status, configurable: true });
      xhr.dispatchEvent(new Event('loadend'));
    });

  it('logs logger.info for status 200', async () => {
    installXhr();
    await openAndFireLoadend('GET', 'https://api/data', 200);

    expect(mockLogger.info).toHaveBeenCalledOnce();
    const [, , attrs] = mockLogger.info.mock.calls[0];
    expect(attrs).toMatchObject({
      'http.method': 'GET',
      'http.url': 'https://api/data',
      'http.status_code': 200,
    });
  });

  it('logs logger.error for status >= 400', async () => {
    installXhr();
    await openAndFireLoadend('DELETE', 'https://api/bad', 500);
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });

  it('logs logger.error for status 0 (network error)', async () => {
    installXhr();
    await openAndFireLoadend('GET', 'https://api/fail', 0);
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });

  it('is idempotent — double install does not double-log', async () => {
    installXhr();
    installXhr();
    await openAndFireLoadend('GET', 'https://api/once', 200);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });
});

describe('installNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNavigation();
  });

  it('logs logger.info with navigation.url when pushState is called', () => {
    installNavigation();
    history.pushState(null, '', '/checkout');
    expect(mockLogger.info).toHaveBeenCalledWith('Navigated to /checkout', [], {
      'navigation.url': '/checkout',
    });
  });

  it('logs logger.info when popstate fires', () => {
    installNavigation();
    history.pushState(null, '', '/back');
    mockLogger.info.mockClear();

    window.dispatchEvent(new PopStateEvent('popstate', {}));
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Navigated to'),
      [],
      expect.objectContaining({ 'navigation.url': expect.any(String) }),
    );
  });

  it('is idempotent — double install does not double-log on pushState', () => {
    installNavigation();
    installNavigation();
    history.pushState(null, '', '/once');
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });
});
