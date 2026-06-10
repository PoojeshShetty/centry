import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const BEARER_PREFIX = 'Bearer ';

/**
 * Express middleware: verifies the `Authorization: Bearer <jwt>` header.
 * On success sets `req.accountId` and calls `next()`; otherwise responds
 * `401 { error: "unauthorized" }` and does not call `next()` (FR-07).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);
  const secret = process.env.JWT_SECRET ?? 'dev-secret';

  try {
    const payload = jwt.verify(token, secret) as { sub?: string };
    if (!payload.sub) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    req.accountId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
