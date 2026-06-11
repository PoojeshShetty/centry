import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/projectKey.js', () => ({
  ProjectKey: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../config/sequelize.js', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

describe('ProjectKeyRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findActiveByProjectId returns the key for a project', async () => {
    const { ProjectKey } = await import('../../models/projectKey.js');
    const { ProjectKeyRepository } = await import('../../repositories/projectKey.js');
    const row = { id: 'k1', project_id: 'p1', public_key: 'abc' };
    vi.mocked(ProjectKey.findOne).mockResolvedValue(row as never);

    const result = await ProjectKeyRepository.findActiveByProjectId('p1');

    expect(ProjectKey.findOne).toHaveBeenCalledWith({ where: { project_id: 'p1' } });
    expect(result).toBe(row);
  });

  it('findActiveByProjectId returns null when no key exists', async () => {
    const { ProjectKey } = await import('../../models/projectKey.js');
    const { ProjectKeyRepository } = await import('../../repositories/projectKey.js');
    vi.mocked(ProjectKey.findOne).mockResolvedValue(null);

    const result = await ProjectKeyRepository.findActiveByProjectId('missing');

    expect(result).toBeNull();
  });

  it('create inserts and returns a new key', async () => {
    const { ProjectKey } = await import('../../models/projectKey.js');
    const { ProjectKeyRepository } = await import('../../repositories/projectKey.js');
    const row = { id: 'k1', project_id: 'p1', public_key: 'newkey' };
    vi.mocked(ProjectKey.create).mockResolvedValue(row as never);

    const result = await ProjectKeyRepository.create('p1', 'newkey');

    expect(ProjectKey.create).toHaveBeenCalledWith({ project_id: 'p1', public_key: 'newkey' });
    expect(result).toBe(row);
  });

  it('replaceKey deletes old key and inserts new key in a transaction', async () => {
    const { ProjectKey } = await import('../../models/projectKey.js');
    const { sequelize } = await import('../../config/sequelize.js');
    const { ProjectKeyRepository } = await import('../../repositories/projectKey.js');

    const newRow = { id: 'k2', project_id: 'p1', public_key: 'newkey' };
    const destroyMock = vi.fn().mockResolvedValue(undefined);
    const existingKey = { destroy: destroyMock };

    vi.mocked(ProjectKey.findOne).mockResolvedValue(existingKey as never);
    vi.mocked(ProjectKey.create).mockResolvedValue(newRow as never);
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: (t: unknown) => Promise<unknown>) => cb({}));

    const result = await ProjectKeyRepository.replaceKey('p1', 'newkey');

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(destroyMock).toHaveBeenCalled();
    expect(ProjectKey.create).toHaveBeenCalledWith(
      { project_id: 'p1', public_key: 'newkey' },
      expect.objectContaining({ transaction: {} }),
    );
    expect(result).toBe(newRow);
  });

  it('replaceKey works when no existing key is present', async () => {
    const { ProjectKey } = await import('../../models/projectKey.js');
    const { sequelize } = await import('../../config/sequelize.js');
    const { ProjectKeyRepository } = await import('../../repositories/projectKey.js');

    const newRow = { id: 'k1', project_id: 'p1', public_key: 'firstkey' };

    vi.mocked(ProjectKey.findOne).mockResolvedValue(null);
    vi.mocked(ProjectKey.create).mockResolvedValue(newRow as never);
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: (t: unknown) => Promise<unknown>) => cb({}));

    const result = await ProjectKeyRepository.replaceKey('p1', 'firstkey');

    expect(ProjectKey.create).toHaveBeenCalledWith(
      { project_id: 'p1', public_key: 'firstkey' },
      expect.objectContaining({ transaction: {} }),
    );
    expect(result).toBe(newRow);
  });
});
