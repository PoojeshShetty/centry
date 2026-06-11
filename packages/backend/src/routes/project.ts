import { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { ProjectService, ProjectNotFoundError, ProjectForbiddenError } from '../services/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

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

export const projectRouter: Router = Router();
projectRouter.get('/', requireAuth, listHandler);
projectRouter.post('/', requireAuth, createHandler);
projectRouter.patch('/:id', requireAuth, updateHandler);
projectRouter.delete('/:id', requireAuth, archiveHandler);
projectRouter.post('/:id/rotate-key', requireAuth, rotateKeyHandler);
