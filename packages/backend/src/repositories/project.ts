import { Project } from '../models/project.js';

export interface CreateProjectInput {
  account_id: string;
  name: string;
  application_url: string;
  description?: string | null;
  environment: string;
}

export type UpdateableProjectFields = Pick<
  Project,
  'name' | 'application_url' | 'description' | 'environment'
>;

export const ProjectRepository = {
  findAllActive(accountId: string): Promise<Project[]> {
    return Project.findAll({ where: { account_id: accountId, archived_at: null } });
  },

  findById(id: string): Promise<Project | null> {
    return Project.findByPk(id);
  },

  create(input: CreateProjectInput): Promise<Project> {
    return Project.create(input);
  },

  async update(id: string, patch: Partial<UpdateableProjectFields>): Promise<Project> {
    const [, [updated]] = await Project.update(patch, { where: { id }, returning: true });
    return updated;
  },

  async archive(id: string): Promise<void> {
    await Project.update({ archived_at: new Date() }, { where: { id } });
  },
};
