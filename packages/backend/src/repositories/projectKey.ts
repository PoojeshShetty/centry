import { ProjectKey } from '../models/projectKey.js';
import { sequelize } from '../config/sequelize.js';

export const ProjectKeyRepository = {
  findActiveByProjectId(projectId: string): Promise<ProjectKey | null> {
    return ProjectKey.findOne({ where: { project_id: projectId } });
  },

  create(projectId: string, publicKey: string): Promise<ProjectKey> {
    return ProjectKey.create({ project_id: projectId, public_key: publicKey });
  },

  replaceKey(projectId: string, newPublicKey: string): Promise<ProjectKey> {
    return sequelize.transaction(async (t) => {
      const existing = await ProjectKey.findOne({ where: { project_id: projectId }, transaction: t });
      if (existing) {
        await existing.destroy({ transaction: t });
      }
      return ProjectKey.create({ project_id: projectId, public_key: newPublicKey }, { transaction: t });
    });
  },
};
