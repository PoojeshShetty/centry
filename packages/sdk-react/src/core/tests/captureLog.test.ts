import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../init.js', () => ({
  getConfig: vi.fn(),
  getTraceId: vi.fn().mockReturnValue('aabbccddeeff00112233445566778899'),
}));

vi.mock('../../buffer/buffer.js', () => ({
  push: vi.fn(),
}));

vi.mock('../../utils/stackTrace.js', () => ({
  parseStack: vi.fn(),
}));

import { captureLog } from '../captureLog.js';
import { getConfig, getTraceId } from '../init.js';
import { push } from '../../buffer/buffer.js';
import { parseStack } from '../../utils/stackTrace.js';
import type { StackFrame } from '../../types.js';
import type { LogItem } from '@centry/shared';

const mockGetConfig = vi.mocked(getConfig);
const mockGetTraceId = vi.mocked(getTraceId);
const mockPush = vi.mocked(push);
const mockParseStack = vi.mocked(parseStack);

const mockConfig = {
  dsn: 'http://pubkey@localhost:3000/proj123',
  publicKey: 'pubkey',
  host: 'localhost:3000',
  projectId: 'proj123',
  enableLogs: true,
};

const mockFrames: StackFrame[] = [{ filename: 'PaymentForm.tsx', function: 'handleSubmit', lineno: 42 }];

describe('captureLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue(mockConfig as ReturnType<typeof getConfig>);
    mockParseStack.mockReturnValue(mockFrames);
  });

  describe('initialization guard', () => {
    it('does nothing when getConfig returns null', () => {
      mockGetConfig.mockReturnValue(null);
      captureLog('info', 9, 'msg');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('enableLogs gate', () => {
    it('does not push when enableLogs is false', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, enableLogs: false } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('template interpolation', () => {
    it('replaces {} placeholders with params sequentially', () => {
      captureLog('info', 9, 'User {name} from {city}', ['Alice', 'NYC']);
      expect(mockPush.mock.calls[0][0].body).toBe('User Alice from NYC');
    });

    it('leaves template unchanged when no params', () => {
      captureLog('info', 9, 'plain message');
      expect(mockPush.mock.calls[0][0].body).toBe('plain message');
    });
  });

  describe('LogItem fields', () => {
    it('sets correct level and severity_number', () => {
      captureLog('warn', 13, 'msg');
      const item = mockPush.mock.calls[0][0];
      expect(item.level).toBe('warn');
      expect(item.severity_number).toBe(13);
    });

    it('sets timestamp to Date.now()', () => {
      const before = Date.now();
      captureLog('info', 9, 'msg');
      const after = Date.now();
      const item = mockPush.mock.calls[0][0];
      expect(item.timestamp).toBeGreaterThanOrEqual(before);
      expect(item.timestamp).toBeLessThanOrEqual(after);
    });

    it('sets trace_id from session', () => {
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].trace_id).toBe('aabbccddeeff00112233445566778899');
    });

    it('omits trace_id when session has none (before init)', () => {
      mockGetTraceId.mockReturnValueOnce(null);
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].trace_id).toBeUndefined();
    });

    it('sets a unique span_id (16 hex chars) per call', () => {
      captureLog('info', 9, 'msg');
      captureLog('info', 9, 'msg');
      const id1 = mockPush.mock.calls[0][0].span_id;
      const id2 = mockPush.mock.calls[1][0].span_id;
      expect(id1).toMatch(/^[0-9a-f]{16}$/);
      expect(id2).toMatch(/^[0-9a-f]{16}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('attributes', () => {
    it('includes client.address from window.location.hostname', () => {
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['client.address']).toBe('localhost');
    });

    it('includes sentry.sdk.name', () => {
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['sentry.sdk.name']).toBe('@centry/sdk-react');
    });

    it('includes sentry.message.template', () => {
      captureLog('info', 9, 'Hello {name}', ['Alice']);
      expect(mockPush.mock.calls[0][0].attributes?.['sentry.message.template']).toBe('Hello {name}');
    });

    it('includes sentry.message.parameter.N for each param', () => {
      captureLog('info', 9, '{a} and {b}', ['X', 'Y']);
      const attrs = mockPush.mock.calls[0][0].attributes;
      expect(attrs?.['sentry.message.parameter.0']).toBe('X');
      expect(attrs?.['sentry.message.parameter.1']).toBe('Y');
    });

    it('includes sentry.environment when configured', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, environment: 'production' } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['sentry.environment']).toBe('production');
    });

    it('includes sentry.release when configured', () => {
      mockGetConfig.mockReturnValue({ ...mockConfig, release: '1.2.3' } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['sentry.release']).toBe('1.2.3');
    });

    it('user-provided attributes are merged alongside SDK attributes', () => {
      captureLog('info', 9, 'msg', undefined, { 'custom.key': 'value' });
      const attrs = mockPush.mock.calls[0][0].attributes;
      expect(attrs?.['custom.key']).toBe('value');
      expect(attrs?.['sentry.sdk.name']).toBe('@centry/sdk-react');
    });

    it('user attributes override SDK defaults on key clash', () => {
      captureLog('info', 9, 'msg', undefined, { 'sentry.sdk.name': 'my-override' });
      expect(mockPush.mock.calls[0][0].attributes?.['sentry.sdk.name']).toBe('my-override');
    });
  });

  describe('stack trace capture', () => {
    it('attaches error.stack_frames for error level (severity >= 17)', () => {
      captureLog('error', 17, 'something failed');
      const raw = mockPush.mock.calls[0][0].attributes?.['error.stack_frames'];
      expect(typeof raw).toBe('string');
      expect(JSON.parse(raw as string)).toEqual(mockFrames);
    });

    it('attaches error.stack_frames for fatal level (severity >= 17)', () => {
      captureLog('fatal', 21, 'fatal');
      expect(mockPush.mock.calls[0][0].attributes?.['error.stack_frames']).toBeDefined();
    });

    it('does not attach error.stack_frames for info level', () => {
      captureLog('info', 9, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['error.stack_frames']).toBeUndefined();
    });

    it('does not attach error.stack_frames for warn level', () => {
      captureLog('warn', 13, 'msg');
      expect(mockPush.mock.calls[0][0].attributes?.['error.stack_frames']).toBeUndefined();
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

    it('buffers the modified log returned by the hook', () => {
      mockGetConfig.mockReturnValue({
        ...mockConfig,
        beforeSendLog: (log: LogItem) => ({ ...log, body: 'modified' }),
      } as ReturnType<typeof getConfig>);
      captureLog('info', 9, 'original');
      expect(mockPush.mock.calls[0][0].body).toBe('modified');
    });
  });

  describe('never throws', () => {
    it('does not throw when getConfig throws internally', () => {
      mockGetConfig.mockImplementation(() => { throw new Error('not initialized'); });
      expect(() => captureLog('info', 9, 'msg')).not.toThrow();
    });

    it('does not throw when push throws', () => {
      mockPush.mockImplementation(() => { throw new Error('buffer error'); });
      expect(() => captureLog('info', 9, 'msg')).not.toThrow();
    });
  });
});
