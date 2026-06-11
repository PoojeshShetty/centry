import type { Request, Response, NextFunction } from 'express';
import { Project, ProjectKey } from '../models/index.js';

function parseSentryKey(header: string): string | null {
  const match = header.match(/sentry_key=([^,\s]+)/);
  return match ? match[1] : null;
}

export async function requireIngestKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers['x-sentry-auth'];
  if (!header || typeof header !== 'string') {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const sentryKey = parseSentryKey(header);
  if (!sentryKey) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const projectKey = await ProjectKey.findOne({ where: { public_key: sentryKey }, include: ['project'] });
  if (!projectKey) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  if (projectKey.project_id !== req.params.id) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  req.project = (projectKey as unknown as { project: Project }).project;
  next();
}
