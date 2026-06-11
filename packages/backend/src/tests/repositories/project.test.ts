import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/project.js', () => ({
  Project: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe('ProjectRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAllActive returns only non-archived projects for the account', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    const rows = [
      { id: 'p1', account_id: 'acc-1', name: 'A', archived_at: null },
      { id: 'p2', account_id: 'acc-1', name: 'B', archived_at: null },
    ];
    vi.mocked(Project.findAll).mockResolvedValue(rows as never);

    const result = await ProjectRepository.findAllActive('acc-1');

    expect(Project.findAll).toHaveBeenCalledWith({
      where: { account_id: 'acc-1', archived_at: null },
    });
    expect(result).toBe(rows);
  });

  it('findById returns the project by primary key', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    const row = { id: 'p1', account_id: 'acc-1', name: 'A' };
    vi.mocked(Project.findByPk).mockResolvedValue(row as never);

    const result = await ProjectRepository.findById('p1');

    expect(Project.findByPk).toHaveBeenCalledWith('p1');
    expect(result).toBe(row);
  });

  it('findById returns null when not found', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    vi.mocked(Project.findByPk).mockResolvedValue(null);

    const result = await ProjectRepository.findById('missing');

    expect(result).toBeNull();
  });

  it('create inserts and returns the project', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    const row = { id: 'p1', account_id: 'acc-1', name: 'A', application_url: 'https://a.com', environment: 'production' };
    vi.mocked(Project.create).mockResolvedValue(row as never);

    const input = { account_id: 'acc-1', name: 'A', application_url: 'https://a.com', environment: 'production' };
    const result = await ProjectRepository.create(input);

    expect(Project.create).toHaveBeenCalledWith(input);
    expect(result).toBe(row);
  });

  it('update sets fields and returns the updated project', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    const updated = { id: 'p1', name: 'New', application_url: 'https://a.com', environment: 'staging' };
    vi.mocked(Project.update).mockResolvedValue([1, [updated]] as never);

    const result = await ProjectRepository.update('p1', { name: 'New' });

    expect(Project.update).toHaveBeenCalledWith(
      { name: 'New' },
      { where: { id: 'p1' }, returning: true },
    );
    expect(result).toBe(updated);
  });

  it('archive sets archived_at on the project row', async () => {
    const { Project } = await import('../../models/project.js');
    const { ProjectRepository } = await import('../../repositories/project.js');
    vi.mocked(Project.update).mockResolvedValue([1, []] as never);

    await ProjectRepository.archive('p1');

    expect(Project.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(Date) }),
      { where: { id: 'p1' } },
    );
  });
});
