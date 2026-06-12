import 'express';
import type { Project } from '../models/project.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid JWT — the authenticated account's id. */
      accountId?: string;
      /** Set by `requireIngestKey` or `requireProjectOwner` after successful auth. */
      project?: Project;
    }
  }
}

export {};
