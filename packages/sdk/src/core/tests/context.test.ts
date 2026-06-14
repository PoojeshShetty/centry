import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { traceStore, traceMiddleware } from '../context.js';

function makeReq(sentryTrace?: string): Request {
  return {
    headers: sentryTrace ? { 'sentry-trace': sentryTrace } : {},
  } as unknown as Request;
}

function makeRes(): Response & { headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  } as unknown as Response & { headers: Record<string, string> };
}

function runMiddleware(
  req: Request,
  res: Response,
): Promise<{ traceId: string; spanId: string } | undefined> {
  return new Promise((resolve) => {
    traceMiddleware(req, res, (() => {
      resolve(traceStore.getStore());
    }) as unknown as NextFunction);
  });
}

describe('traceMiddleware', () => {
  it('reuses traceId from incoming sentry-trace header and generates new spanId', async () => {
    const req = makeReq('abc123def456-00f067aa0ba902fc-1');
    const res = makeRes();
    const store = await runMiddleware(req, res);

    expect(store?.traceId).toBe('abc123def456');
    expect(store?.spanId).not.toBe('00f067aa0ba902fc');
    expect(store?.spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('generates fresh 32-hex traceId and 16-hex spanId when no header present', async () => {
    const req = makeReq();
    const res = makeRes();
    const store = await runMiddleware(req, res);

    expect(store?.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(store?.spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('sets outgoing sentry-trace response header when no incoming header', async () => {
    const req = makeReq();
    const res = makeRes();
    await runMiddleware(req, res);

    expect(res.headers['sentry-trace']).toMatch(/^[0-9a-f]{32}-[0-9a-f]{16}-1$/);
  });

  it('sets sentry-trace response header using reused traceId when incoming header present', async () => {
    const req = makeReq('abc123def456-00f067aa0ba902fc-1');
    const res = makeRes();
    await runMiddleware(req, res);

    expect(res.headers['sentry-trace']).toMatch(/^abc123def456-[0-9a-f]{16}-1$/);
  });

  it('makes context accessible via traceStore.getStore() inside next() but not outside', async () => {
    const req = makeReq();
    const res = makeRes();
    let insideStore: { traceId: string; spanId: string } | undefined;

    await new Promise<void>((resolve) => {
      traceMiddleware(req, res, (() => {
        insideStore = traceStore.getStore();
        resolve();
      }) as unknown as NextFunction);
    });

    expect(traceStore.getStore()).toBeUndefined();
    expect(insideStore?.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(insideStore?.spanId).toMatch(/^[0-9a-f]{16}$/);
  });
});
