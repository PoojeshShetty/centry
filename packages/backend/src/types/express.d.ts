import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid JWT — the authenticated account's id. */
      accountId?: string;
    }
  }
}

export {};
