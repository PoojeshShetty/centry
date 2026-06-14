import { AsyncLocalStorage } from 'async_hooks';
import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { TraceContext } from './types.js';

export const traceStore = new AsyncLocalStorage<TraceContext>();

function hex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['sentry-trace'] as string | undefined;

  let traceId: string;
  let spanId: string;

  if (incoming) {
    const parts = incoming.split('-');
    traceId = parts[0];
    spanId = hex(8); // 16 hex chars
  } else {
    traceId = hex(16); // 32 hex chars
    spanId = hex(8); // 16 hex chars
  }

  res.setHeader('sentry-trace', `${traceId}-${spanId}-1`);
  traceStore.run({ traceId, spanId }, next as () => void);
}
