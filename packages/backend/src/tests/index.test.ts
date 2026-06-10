import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express, type Router } from 'express';

/** Mock the sequelize singleton's authenticate() with a chosen outcome. */
function mockSequelize(authenticate: () => Promise<unknown>): void {
  vi.doMock('../config/sequelize.js', () => ({
    sequelize: { authenticate: vi.fn(authenticate) },
  }));
}

/** Mock the express default export to return the given app instance (with a stub `express.json`). */
function mockExpress(app: unknown): void {
  const factory = vi.fn(() => app) as unknown as { json: () => unknown };
  factory.json = vi.fn(() => 'json-mw');
  vi.doMock('express', () => ({ default: factory }));
}

describe('src/index.ts', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    // Stub the routes barrel so index.ts wiring never pulls in the Sequelize
    // model chain (these tests mock the sequelize singleton).
    vi.doMock('../routes/index.js', () => ({ authRouter: express.Router() }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  it('listens on PORT from environment', async () => {
    process.env.PORT = '3001';
    const listen = vi.fn();
    mockExpress({ listen, use: vi.fn() });
    mockSequelize(() => Promise.resolve());

    await import('../index.js');

    await vi.waitFor(() => expect(listen).toHaveBeenCalledWith(3001, expect.any(Function)));
  });

  it('calls process.exit(1) on DB failure', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockExpress({ listen: vi.fn(), use: vi.fn() });
    mockSequelize(() => Promise.reject(new Error('connection refused')));

    await import('../index.js');

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
  });

  it('mounts the auth router under /api/auth with json parsing', async () => {
    // Never-resolving authenticate() keeps the .then() chain from firing, so
    // listen() is never called and we can inspect the app synchronously.
    mockSequelize(() => new Promise(() => {}));
    // Use the real express (default + static .json) so express.json() resolves.
    vi.doMock('express', () => ({ default: express }));

    const { app } = (await import('../index.js')) as { app: Express };

    // _router is an Express 4 internal, created on the first route/middleware
    // registration — defined here proves express.json() + the router are wired.
    const internals = app as { _router?: Router };
    expect(internals._router).toBeDefined();

    const mounted = internals._router!.stack.some(
      (layer: { regexp?: RegExp }) => layer.regexp?.test('/api/auth'),
    );
    expect(mounted).toBe(true);
  });
});
