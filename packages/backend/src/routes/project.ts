import { randomUUID } from 'crypto';
import express, { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { parseEnvelope, EnvelopeParseError } from '@centry/shared';
import { ProjectService, ProjectNotFoundError, ProjectForbiddenError } from '../services/index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireIngestKey } from '../middleware/requireIngestKey.js';
import { requireProjectOwner } from '../middleware/requireProjectOwner.js';
import { LogRepository } from '../repositories/log.js';

function zodMessage(err: ZodError): string {
  return err.issues[0]?.message ?? 'invalid input';
}

export async function listHandler(req: Request, res: Response): Promise<void> {
  const projects = await ProjectService.list(req.accountId!);
  res.status(200).json(projects);
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  try {
    const project = await ProjectService.create(req.accountId!, req.body);
    res.status(201).json(project);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: zodMessage(err) });
    } else {
      throw err;
    }
  }
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  try {
    const project = await ProjectService.update(req.accountId!, req.params.id, req.body);
    res.status(200).json(project);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: zodMessage(err) });
    } else if (err instanceof ProjectNotFoundError) {
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      res.status(403).json({ error: 'forbidden' });
    } else {
      throw err;
    }
  }
}

export async function archiveHandler(req: Request, res: Response): Promise<void> {
  try {
    await ProjectService.archive(req.accountId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      res.status(403).json({ error: 'forbidden' });
    } else {
      throw err;
    }
  }
}

export async function rotateKeyHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await ProjectService.rotateKey(req.accountId!, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      res.status(403).json({ error: 'forbidden' });
    } else {
      throw err;
    }
  }
}

export async function ingestHandler(req: Request, res: Response): Promise<void> {
  try {
    const envelope = parseEnvelope(req.body as string);
    const logItems = envelope.items.filter((item) => item !== null && item !== undefined);
    await LogRepository.bulkCreate(req.params.id, logItems);
    res.status(200).json({ id: randomUUID() });
  } catch (err) {
    if (err instanceof EnvelopeParseError) {
      res.status(400).json({ error: 'malformed envelope' });
    } else {
      throw err;
    }
  }
}

export async function queryHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as Record<string, string>;
  const rawLimit = parseInt(query['limit'] ?? '50', 10);
  const limit = Math.min(isNaN(rawLimit) ? 50 : rawLimit, 200);

  const filters = {
    limit,
    ...(query['level'] ? { level: query['level'].split(',') } : {}),
    ...(query['search'] ? { search: query['search'] } : {}),
    ...(query['start'] ? { start: parseFloat(query['start']) } : {}),
    ...(query['end'] ? { end: parseFloat(query['end']) } : {}),
    ...(query['cursor'] ? { cursor: query['cursor'] } : {}),
  };

  const { rows, nextCursor, hasMore } = await LogRepository.findWithFilters(req.params.id, filters);
  res.status(200).json({ logs: rows, nextCursor, hasMore });
}

export const projectRouter: Router = Router();
projectRouter.get('/', requireAuth, listHandler);
projectRouter.post('/', requireAuth, createHandler);
projectRouter.patch('/:id', requireAuth, updateHandler);
projectRouter.delete('/:id', requireAuth, archiveHandler);
projectRouter.post('/:id/rotate-key', requireAuth, rotateKeyHandler);
projectRouter.post('/:id/envelope/', requireIngestKey, express.text({ type: 'application/x-sentry-envelope' }), ingestHandler);
projectRouter.get('/:id/logs', requireAuth, requireProjectOwner, queryHandler);
