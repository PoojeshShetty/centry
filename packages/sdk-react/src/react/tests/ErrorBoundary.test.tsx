import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { logger } from '../../core/logger.js';

const mockLogger = vi.mocked(logger);

function Bomb(): never {
  throw new Error('test error');
}

const originalConsoleError = console.error;

beforeEach(() => {
  vi.clearAllMocks();
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    render(
      <ErrorBoundary fallback={<p>Oops</p>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Oops')).toBeDefined();
  });

  it('renders default fallback when no fallback prop', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong.')).toBeDefined();
  });

  it('calls logger.fatal with error message and component_stack attribute', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(mockLogger.fatal).toHaveBeenCalledWith(
      'test error',
      [],
      expect.objectContaining({
        'error.component_stack': expect.any(String),
      }),
    );
  });
});
