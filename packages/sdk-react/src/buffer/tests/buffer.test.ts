import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../transport/transport.js', () => ({
  send: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../core/init.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    publicKey: 'pubkey',
    host: 'localhost:3000',
    projectId: 'proj123',
    dsn: 'http://pubkey@localhost:3000/proj123',
  }),
}));

vi.mock('../../transport/envelope.js', () => ({
  build: vi.fn().mockReturnValue('mocked-envelope-str'),
}));

vi.mock('../../transport/urls.js', () => ({
  envelopeUrl: vi.fn().mockReturnValue('http://localhost:3000/api/projects/proj123/envelope/'),
}));

import { push, flush, beacon, resetForTest, setBufferForTest } from '../buffer.js';
import { send } from '../../transport/transport.js';
import type { LogItem } from '@centry/shared';

const mockSend = vi.mocked(send);

const makeLog = (overrides: Partial<LogItem> = {}): LogItem => ({
  timestamp: 1_700_000_000_000,
  level: 'info',
  severity_number: 9,
  body: 'test',
  ...overrides,
});

describe('buffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetForTest();
  });

  describe('push', () => {
    it('does not flush when buffer has fewer than 100 items', () => {
      push(makeLog());
      push(makeLog());
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('triggers flush immediately when buffer reaches 100 items', async () => {
      for (let i = 0; i < 99; i++) push(makeLog());
      expect(mockSend).not.toHaveBeenCalled();

      push(makeLog());
      await Promise.resolve();

      expect(mockSend).toHaveBeenCalledOnce();
      expect(mockSend.mock.calls[0][0]).toHaveLength(100);
    });
  });

  describe('flush', () => {
    it('drains buffer and calls transport.send', async () => {
      push(makeLog({ body: 'a' }));
      push(makeLog({ body: 'b' }));
      await flush();

      expect(mockSend).toHaveBeenCalledOnce();
      expect(mockSend.mock.calls[0][0]).toHaveLength(2);
    });

    it('is no-op when buffer is empty', async () => {
      await flush();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('beacon', () => {
    it('calls navigator.sendBeacon with envelope URL and string', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon });
      setBufferForTest([makeLog(), makeLog()]);

      beacon();

      expect(mockSendBeacon).toHaveBeenCalledOnce();
      expect(mockSendBeacon).toHaveBeenCalledWith(
        'http://localhost:3000/api/projects/proj123/envelope/',
        'mocked-envelope-str',
      );
    });

    it('does nothing when buffer is empty', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon });
      beacon();
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });
  });

  describe('beforeunload', () => {
    it('calls beacon (sendBeacon) when beforeunload fires', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon });
      setBufferForTest([makeLog()]);

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockSendBeacon).toHaveBeenCalledOnce();
    });
  });
});
