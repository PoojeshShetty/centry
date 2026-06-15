export { Account } from './account.js';
export { Project } from './project.js';
export { ProjectKey } from './projectKey.js';
export { Log } from './log.js';

import { Project } from './project.js';
import { ProjectKey } from './projectKey.js';

ProjectKey.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
