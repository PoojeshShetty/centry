import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../transport/transport.js', () => ({
  send: vi.fn().mockResolvedValue(undefined),
}));

import { push, flush, getDropped, resetForTest, setBufferForTest } from '../buffer.js';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('push', () => {
    it('flushes immediately when buffer reaches 100 items', async () => {
      for (let i = 0; i < 99; i++) push(makeLog());
      expect(mockSend).not.toHaveBeenCalled();

      push(makeLog());
      await Promise.resolve();

      expect(mockSend).toHaveBeenCalledOnce();
      const batch = mockSend.mock.calls[0][0];
      expect(batch).toHaveLength(100);
    });

    it('drops item and increments dropped counter at 1000-item cap', () => {
      setBufferForTest(Array.from({ length: 1000 }, makeLog));
      expect(getDropped()).toBe(0);

      push(makeLog());
      expect(getDropped()).toBe(1);
    });

    it('drops all items beyond 1000', () => {
      setBufferForTest(Array.from({ length: 1000 }, makeLog));
      push(makeLog());
      push(makeLog());
      expect(getDropped()).toBe(2);
    });
  });

  describe('flush', () => {
    it('drains buffer atomically and calls transport.send', async () => {
      push(makeLog({ body: 'a' }));
      push(makeLog({ body: 'b' }));

      await flush();

      expect(mockSend).toHaveBeenCalledOnce();
      const batch = mockSend.mock.calls[0][0];
      expect(batch).toHaveLength(2);
    });

    it('is a no-op when buffer is empty', async () => {
      await flush();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('drains buffer before sending so concurrent flush sees empty buffer', async () => {
      push(makeLog());
      const flushPromise = flush();
      push(makeLog());
      await flushPromise;

      expect(mockSend).toHaveBeenCalledOnce();
      const batch = mockSend.mock.calls[0][0];
      expect(batch).toHaveLength(1);
    });
  });

  describe('SIGTERM / SIGINT', () => {
    it('flushes then exits on SIGTERM', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      push(makeLog());

      process.emit('SIGTERM');
      await new Promise((r) => setTimeout(r, 10));

      expect(mockSend).toHaveBeenCalledOnce();
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('flushes then exits on SIGINT', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      push(makeLog());

      process.emit('SIGINT');
      await new Promise((r) => setTimeout(r, 10));

      expect(mockSend).toHaveBeenCalledOnce();
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });
});
