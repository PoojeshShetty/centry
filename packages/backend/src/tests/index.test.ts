import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express, type Router } from 'express';

/** Mock the sequelize singleton's authenticate() with a chosen outcome. */
function mockSequelize(authenticate: () => Promise<unknown>): void {
  vi.doMock('../config/sequelize.js', () => ({
    sequelize: { authenticate: vi.fn(authenticate) },
  }));
}

/** Mock the express default export to return the given app instance. */
function mockExpress(app: unknown): void {
  vi.doMock('express', () => ({ default: vi.fn(() => app) }));
}

describe('src/index.ts', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  it('listens on PORT from environment', async () => {
    process.env.PORT = '3001';
    const listen = vi.fn();
    mockExpress({ listen });
    mockSequelize(() => Promise.resolve());

    await import('../index.js');

    await vi.waitFor(() => expect(listen).toHaveBeenCalledWith(3001, expect.any(Function)));
  });

  it('calls process.exit(1) on DB failure', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockExpress({ listen: vi.fn() });
    mockSequelize(() => Promise.reject(new Error('connection refused')));

    await import('../index.js');

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
  });

  it('has no routes registered', async () => {
    // Never-resolving authenticate() keeps the .then() chain from firing, so
    // listen() is never called and we can inspect the app synchronously.
    mockSequelize(() => new Promise(() => {}));
    vi.doMock('express', () => ({ default: () => express() }));

    const { app } = (await import('../index.js')) as { app: Express };

    // _router is an Express 4 internal, lazily created on the first route/
    // middleware registration — undefined here proves nothing is wired.
    const internals = app as { _router?: Router };
    expect(internals._router).toBeUndefined();
  });
});
