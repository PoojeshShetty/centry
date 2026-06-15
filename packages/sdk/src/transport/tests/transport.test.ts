import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../core/init.js', () => ({
  getConfig: vi.fn(),
}));

vi.mock('../envelope.js', () => ({
  build: vi.fn(),
}));

import { send } from '../transport.js';
import { getConfig } from '../../core/init.js';
import { build } from '../envelope.js';
import type { LogItem } from '@centry/shared';

const mockGetConfig = vi.mocked(getConfig);
const mockBuild = vi.mocked(build);

const makeLog = (overrides: Partial<LogItem> = {}): LogItem => ({
  timestamp: 1_700_000_000_000,
  level: 'info',
  severity_number: 9,
  body: 'test message',
  ...overrides,
});

const mockConfig = {
  dsn: 'https://pubkey@localhost:3000/proj123',
  publicKey: 'pubkey',
  host: 'localhost:3000',
  projectId: 'proj123',
};

describe('transport.send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuild.mockReturnValue('mocked-envelope-string');
    mockGetConfig.mockReturnValue(mockConfig as ReturnType<typeof getConfig>);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  it('POSTs to correct URL with correct headers', async () => {
    await send([makeLog()]);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/projects/proj123/envelope/', {
      method: 'POST',
      body: 'mocked-envelope-string',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': expect.stringContaining('sentry_key=pubkey'),
      },
    });
  });

  it('includes sentry_version=7 and sentry_client in X-Sentry-Auth', async () => {
    await send([makeLog()]);

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const auth = (options.headers as Record<string, string>)['X-Sentry-Auth'];
    expect(auth).toContain('sentry_version=7');
    expect(auth).toContain('sentry_client=');
  });

  it('logs console.error on non-2xx response and does not throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(send([makeLog()])).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('500'));

    consoleSpy.mockRestore();
  });

  it('swallows network errors and logs to console.error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(send([makeLog()])).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns silently when called before init() without throwing', async () => {
    mockGetConfig.mockImplementation(() => {
      throw new Error('call init() before using logger');
    });

    await expect(send([makeLog()])).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
