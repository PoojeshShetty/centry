import { randomUUID } from 'crypto';
import express, { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '@centry/sdk';
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
  logger.info('Listed {count} projects for account {accountId}', [projects.length, req.accountId]);
  res.status(200).json(projects);
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  try {
    const project = await ProjectService.create(req.accountId!, req.body);
    logger.info('Project created: {projectId} for account {accountId}', [project.id, req.accountId]);
    res.status(201).json(project);
  } catch (err) {
    if (err instanceof ZodError) {
      logger.warn('Project create validation failed: {error}', [zodMessage(err)]);
      res.status(400).json({ error: zodMessage(err) });
    } else {
      logger.error('Project create failed for account {accountId}: {error}', [req.accountId, (err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  try {
    const project = await ProjectService.update(req.accountId!, req.params.id, req.body);
    logger.info('Project updated: {projectId}', [req.params.id]);
    res.status(200).json(project);
  } catch (err) {
    if (err instanceof ZodError) {
      logger.warn('Project update validation failed for {projectId}: {error}', [req.params.id, zodMessage(err)]);
      res.status(400).json({ error: zodMessage(err) });
    } else if (err instanceof ProjectNotFoundError) {
      logger.warn('Project update: not found {projectId}', [req.params.id]);
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      logger.warn('Project update: forbidden for account {accountId} on {projectId}', [req.accountId, req.params.id]);
      res.status(403).json({ error: 'forbidden' });
    } else {
      logger.error('Project update failed for {projectId}: {error}', [req.params.id, (err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

export async function archiveHandler(req: Request, res: Response): Promise<void> {
  try {
    await ProjectService.archive(req.accountId!, req.params.id);
    logger.info('Project archived: {projectId}', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      logger.warn('Project archive: not found {projectId}', [req.params.id]);
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      logger.warn('Project archive: forbidden for account {accountId} on {projectId}', [req.accountId, req.params.id]);
      res.status(403).json({ error: 'forbidden' });
    } else {
      logger.error('Project archive failed for {projectId}: {error}', [req.params.id, (err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

export async function rotateKeyHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await ProjectService.rotateKey(req.accountId!, req.params.id);
    logger.info('Key rotated for project {projectId}', [req.params.id]);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      logger.warn('Rotate key: project not found {projectId}', [req.params.id]);
      res.status(404).json({ error: 'not found' });
    } else if (err instanceof ProjectForbiddenError) {
      logger.warn('Rotate key: forbidden for account {accountId} on {projectId}', [req.accountId, req.params.id]);
      res.status(403).json({ error: 'forbidden' });
    } else {
      logger.error('Rotate key failed for {projectId}: {error}', [req.params.id, (err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

export async function ingestHandler(req: Request, res: Response): Promise<void> {
  try {
    const envelope = parseEnvelope(req.body as string);
    const logItems = envelope.items.filter((item) => item !== null && item !== undefined);
    await LogRepository.bulkCreate(req.params.id, logItems);
    // logger.info('Ingested {count} log items for project {projectId}', [logItems.length, req.params.id]);
    res.status(200).json({ id: randomUUID() });
  } catch (err) {
    if (err instanceof EnvelopeParseError) {
      logger.warn('Malformed envelope received for project {projectId}', [req.params.id]);
      res.status(400).json({ error: 'malformed envelope' });
    } else {
      logger.error('Ingest failed for project {projectId}: {error}', [req.params.id, (err as Error).message], { 'error.stack': (err as Error).stack });
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
  logger.info('Queried {count} logs for project {projectId}', [rows.length, req.params.id]);
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
