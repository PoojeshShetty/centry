import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../core/init.js', () => ({
  getConfig: vi.fn(),
}));

vi.mock('../envelope.js', () => ({
  build: vi.fn().mockReturnValue('mocked-envelope-string'),
}));

vi.mock('../urls.js', () => ({
  envelopeUrl: vi.fn().mockReturnValue('http://localhost:3000/api/projects/p1/envelope/'),
}));

import { send } from '../transport.js';
import { getConfig } from '../../core/init.js';
import type { LogItem } from '@centry/shared';

const mockGetConfig = vi.mocked(getConfig);
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockConfig = {
  dsn: 'http://pubkey@localhost:3000/proj1',
  publicKey: 'pubkey',
  host: 'localhost:3000',
  projectId: 'proj1',
};

const makeLog = (): LogItem => ({
  timestamp: 1_700_000_000_000,
  level: 'info',
  severity_number: 9,
  body: 'test',
});

describe('transport.send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue(mockConfig as ReturnType<typeof getConfig>);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  it('POSTs to the envelope URL', async () => {
    await send([makeLog()]);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/projects/p1/envelope/',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sets Content-Type to application/x-sentry-envelope', async () => {
    await send([makeLog()]);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBe('application/x-sentry-envelope');
  });

  it('sets X-Sentry-Auth with sentry_version=7 and the publicKey', async () => {
    await send([makeLog()]);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['X-Sentry-Auth']).toContain('sentry_version=7');
    expect(headers['X-Sentry-Auth']).toContain('pubkey');
  });

  it('warns on non-2xx response and resolves without throwing', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(send([makeLog()])).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('warns on network error and resolves without throwing', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(send([makeLog()])).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('does nothing when config is null (not initialized)', async () => {
    mockGetConfig.mockReturnValue(null);
    await send([makeLog()]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
