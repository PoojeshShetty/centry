import type { Request, Response, NextFunction } from 'express';
import { Project } from '../models/index.js';

export async function requireProjectOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'not found' });
    return;
  }

  if (project.account_id !== req.accountId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  req.project = project;
  next();
}
