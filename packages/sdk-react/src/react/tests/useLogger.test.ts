import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

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

import { useLogger } from '../useLogger.js';
import { logger } from '../../core/logger.js';

const mockLogger = vi.mocked(logger);

describe('useLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-merges component.name into attributes on info call', () => {
    const { result } = renderHook(() => useLogger('PaymentForm'));
    result.current.info('msg');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'msg',
      undefined,
      expect.objectContaining({ 'component.name': 'PaymentForm' }),
    );
  });

  it('auto-merges component.name when user attributes are also provided', () => {
    const { result } = renderHook(() => useLogger('PaymentForm'));
    result.current.warn('msg', [], { extra: 'data' });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'msg',
      [],
      expect.objectContaining({ 'component.name': 'PaymentForm', extra: 'data' }),
    );
  });

  it('returns stable reference across re-renders with same componentName', () => {
    const { result, rerender } = renderHook(() => useLogger('PaymentForm'));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('returns new reference when componentName changes', () => {
    const { result, rerender } = renderHook(({ name }: { name: string }) => useLogger(name), {
      initialProps: { name: 'FormA' },
    });
    const first = result.current;
    rerender({ name: 'FormB' });
    expect(result.current).not.toBe(first);
  });
});
