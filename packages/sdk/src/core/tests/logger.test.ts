import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../captureLog.js', () => ({
  captureLog: vi.fn(),
}));

import { logger } from '../logger.js';
import { captureLog } from '../captureLog.js';

const mockCaptureLog = vi.mocked(captureLog);

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const levels: Array<{ method: keyof typeof logger; level: string; severityNumber: number }> = [
    { method: 'trace', level: 'trace', severityNumber: 1 },
    { method: 'debug', level: 'debug', severityNumber: 5 },
    { method: 'info', level: 'info', severityNumber: 9 },
    { method: 'warn', level: 'warn', severityNumber: 13 },
    { method: 'error', level: 'error', severityNumber: 17 },
    { method: 'fatal', level: 'fatal', severityNumber: 21 },
  ];

  describe('severity mapping', () => {
    it.each(levels)('$method calls captureLog with level "$level" and severityNumber $severityNumber', ({ method, level, severityNumber }) => {
      logger[method]('test message');
      expect(mockCaptureLog).toHaveBeenCalledWith(level, severityNumber, 'test message', undefined, undefined);
    });
  });

  describe('argument forwarding', () => {
    it('forwards template, params, and attributes to captureLog', () => {
      logger.error('Payment failed for %s', ['ORD-99'], { 'payment.code': 'declined' });
      expect(mockCaptureLog).toHaveBeenCalledWith('error', 17, 'Payment failed for %s', ['ORD-99'], { 'payment.code': 'declined' });
    });

    it('forwards params without attributes', () => {
      logger.info('Hello %s', ['world']);
      expect(mockCaptureLog).toHaveBeenCalledWith('info', 9, 'Hello %s', ['world'], undefined);
    });

    it('forwards template only when no params or attributes', () => {
      logger.warn('simple message');
      expect(mockCaptureLog).toHaveBeenCalledWith('warn', 13, 'simple message', undefined, undefined);
    });
  });

  describe('never throws (FR-09)', () => {
    it('does not throw when captureLog throws', () => {
      mockCaptureLog.mockImplementation(() => {
        throw new Error('unexpected');
      });
      expect(() => logger.info('msg')).not.toThrow();
    });
  });

  describe('public shape', () => {
    it('has exactly six methods', () => {
      const methods = Object.keys(logger);
      expect(methods.sort()).toEqual(['debug', 'error', 'fatal', 'info', 'trace', 'warn']);
    });
  });
});
