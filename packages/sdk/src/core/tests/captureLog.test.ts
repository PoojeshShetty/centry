import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../init.js', () => ({
  getConfig: vi.fn(),
}));

vi.mock('../../buffer/buffer.js', () => ({
  push: vi.fn(),
}));

vi.mock('../../utils/stackTrace.js', () => ({
  parseStack: vi.fn(),
}));

vi.mock('../context.js', () => ({
  traceStore: {
    getStore: vi.fn(),
  },
}));

vi.mock('os', () => ({
  hostname: vi.fn().mockReturnValue('test-host'),
}));

import { captureLog } from '../captureLog.js';
import { getConfig } from '../init.js';
import { push } from '../../buffer/buffer.js';
import { parseStack } from '../../utils/stackTrace.js';
import { traceStore } from '../context.js';
import type { StackFrame } from '../../types.js';

const mockGetConfig = vi.mocked(getConfig);
const mockPush = vi.mocked(push);
const mockParseStack = vi.mocked(parseStack);
const mockGetStore = vi.mocked(traceStore.getStore);

const mockConfig = {
  dsn: 'https://pubkey@localhost:3000/proj123',
  publicKey: 'pubkey',
  host: 'localhost:3000',
  projectId: 'proj123',
  enableLogs: true,
};

const mockFrames: StackFrame[] = [{ filename: 'app.ts', function: 'main', lineno: 10 }];

describe('captureLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue(mockConfig as ReturnType<typeof getConfig>);
    mockParseStack.mockReturnValue(mockFrames);
    mockGetStore.mockReturnValue(undefined);
  });

  describe('enableLogs gate', () => {
    it('does not call buffer.push when enableLogs is false', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, enableLogs: false } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('template interpolation', () => {
    it('replaces %s placeholders with params sequentially', () => {
      captureLog('info', 9, 'User %s logged in from %s', ['john', 'NYC']);
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.body).toBe('User john logged in from NYC');
    });

    it('leaves template unchanged when no params', () => {
      captureLog('info', 9, 'plain message');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.body).toBe('plain message');
    });
  });

  describe('stack trace capture', () => {
    it('attaches JSON-stringified error.stack_frames for severityNumber >= 17 (error)', () => {
      captureLog('error', 17, 'something failed');
      const logItem = mockPush.mock.calls[0][0];
      const raw = logItem.attributes?.['error.stack_frames'];
      expect(typeof raw).toBe('string');
      expect(JSON.parse(raw as string)).toEqual(mockFrames);
    });

    it('attaches error.stack_frames for severityNumber >= 17 (fatal)', () => {
      captureLog('fatal', 21, 'fatal error');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['error.stack_frames']).toBeDefined();
    });

    it('does not attach error.stack_frames for severityNumber < 17 (info)', () => {
      captureLog('info', 9, 'info message');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['error.stack_frames']).toBeUndefined();
    });

    it('does not attach error.stack_frames for severityNumber < 17 (warn)', () => {
      captureLog('warn', 13, 'warn message');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['error.stack_frames']).toBeUndefined();
    });
  });

  describe('trace context', () => {
    it('includes traceId and spanId when ALS context is active', () => {
      mockGetStore.mockReturnValue({ traceId: 'abc123', spanId: 'def456' });
      captureLog('info', 9, 'msg');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.trace_id).toBe('abc123');
      expect(logItem.span_id).toBe('def456');
    });

    it('omits trace_id and span_id when no ALS context', () => {
      mockGetStore.mockReturnValue(undefined);
      captureLog('info', 9, 'msg');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.trace_id).toBeUndefined();
      expect(logItem.span_id).toBeUndefined();
    });
  });

  describe('SDK default attributes', () => {
    it('includes sentry.sdk.name, sentry.sdk.version, server.address, sentry.message.template', () => {
      captureLog('info', 9, 'test template');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['sentry.sdk.name']).toBe('@centry/sdk');
      expect(logItem.attributes?.['sentry.sdk.version']).toBeDefined();
      expect(logItem.attributes?.['server.address']).toBe('test-host');
      expect(logItem.attributes?.['sentry.message.template']).toBe('test template');
    });

    it('includes sentry.message.parameter.N for each param', () => {
      captureLog('info', 9, 'Hello %s and %s', ['Alice', 'Bob']);
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['sentry.message.parameter.0']).toBe('Alice');
      expect(logItem.attributes?.['sentry.message.parameter.1']).toBe('Bob');
    });

    it('includes sentry.environment when configured', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, environment: 'production' } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['sentry.environment']).toBe('production');
    });

    it('includes sentry.release when configured', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, release: '1.2.3' } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['sentry.release']).toBe('1.2.3');
    });
  });

  describe('attribute merge', () => {
    it('user-provided attributes override SDK defaults on key clash', () => {
      captureLog('info', 9, 'msg', undefined, { 'sentry.sdk.name': 'my-override' });
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['sentry.sdk.name']).toBe('my-override');
    });

    it('user attributes are merged alongside SDK attributes', () => {
      captureLog('info', 9, 'msg', undefined, { 'custom.key': 'custom-value' });
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.attributes?.['custom.key']).toBe('custom-value');
      expect(logItem.attributes?.['sentry.sdk.name']).toBe('@centry/sdk');
    });
  });

  describe('beforeSendLog hook', () => {
    it('drops log silently when hook returns null', () => {
      mockGetConfig.mockReturnValue({
        ...mockConfig,
        beforeSendLog: () => null,
      } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('uses the modified log returned by the hook', () => {
      mockGetConfig.mockReturnValue({
        ...mockConfig,
        beforeSendLog: (log) => ({ ...log, body: 'modified' }),
      } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'original');
      const logItem = mockPush.mock.calls[0][0];
      expect(logItem.body).toBe('modified');
    });
  });

  describe('never throws (FR-09)', () => {
    it('does not throw when getConfig throws', () => {
      mockGetConfig.mockImplementation(() => {
        throw new Error('not initialized');
      });
      expect(() => captureLog('info', 9, 'msg')).not.toThrow();
    });

    it('does not throw when buffer.push throws', () => {
      mockPush.mockImplementation(() => {
        throw new Error('buffer error');
      });
      expect(() => captureLog('info', 9, 'msg')).not.toThrow();
    });
  });
});
