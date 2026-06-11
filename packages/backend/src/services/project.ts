import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ProjectRepository, ProjectKeyRepository } from '../repositories/index.js';
import type { Project } from '../models/project.js';

export class ProjectNotFoundError extends Error {
  constructor() {
    super('project not found');
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectForbiddenError extends Error {
  constructor() {
    super('forbidden');
    this.name = 'ProjectForbiddenError';
  }
}

export interface ProjectWithDsn {
  id: string;
  account_id: string;
  name: string;
  application_url: string;
  description: string | null;
  environment: string;
  archived_at: Date | null;
  created_at: Date;
  dsn: string;
}

const createSchema = z.object({
  name: z.string().min(1),
  application_url: z.string().url(),
  description: z.string().optional(),
  environment: z.string().min(1),
});

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    application_url: z.string().url().optional(),
    description: z.string().optional(),
    environment: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'at least one field required' });

export type CreateProjectInput = z.infer<typeof createSchema>;
export type UpdateProjectPatch = z.infer<typeof updateSchema>;

function mintPublicKey(): string {
  return randomBytes(32).toString('hex');
}

function buildDsn(publicKey: string, projectId: string): string {
  const host = process.env.CENTRY_HOST ?? 'localhost:3000';
  return `https://${publicKey}@${host}/${projectId}`;
}

function withDsn(project: Project, publicKey: string): ProjectWithDsn {
  return {
    id: project.id,
    account_id: project.account_id,
    name: project.name,
    application_url: project.application_url,
    description: project.description ?? null,
    environment: project.environment,
    archived_at: project.archived_at ?? null,
    created_at: project.created_at,
    dsn: buildDsn(publicKey, project.id),
  };
}

async function assertOwnership(accountId: string, projectId: string): Promise<Project> {
  const project = await ProjectRepository.findById(projectId);
  if (!project) throw new ProjectNotFoundError();
  if (project.account_id !== accountId) throw new ProjectForbiddenError();
  return project;
}

export const ProjectService = {
  async list(accountId: string): Promise<ProjectWithDsn[]> {
    const projects = await ProjectRepository.findAllActive(accountId);
    return Promise.all(
      projects.map(async (p) => {
        const key = await ProjectKeyRepository.findActiveByProjectId(p.id);
        return withDsn(p, key?.public_key ?? '');
      }),
    );
  },

  async create(accountId: string, input: CreateProjectInput): Promise<ProjectWithDsn> {
    const validated = createSchema.parse(input);
    const publicKey = mintPublicKey();
    const project = await ProjectRepository.create({ account_id: accountId, ...validated });
    await ProjectKeyRepository.create(project.id, publicKey);
    return withDsn(project, publicKey);
  },

  async update(accountId: string, id: string, patch: UpdateProjectPatch): Promise<ProjectWithDsn> {
    const validated = updateSchema.parse(patch);
    await assertOwnership(accountId, id);
    const updated = await ProjectRepository.update(id, validated);
    const key = await ProjectKeyRepository.findActiveByProjectId(id);
    return withDsn(updated, key?.public_key ?? '');
  },

  async archive(accountId: string, id: string): Promise<void> {
    await assertOwnership(accountId, id);
    await ProjectRepository.archive(id);
  },

  async rotateKey(accountId: string, id: string): Promise<{ dsn: string }> {
    await assertOwnership(accountId, id);
    const publicKey = mintPublicKey();
    await ProjectKeyRepository.replaceKey(id, publicKey);
    return { dsn: buildDsn(publicKey, id) };
  },
};
