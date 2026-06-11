import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/index.js', () => ({
  ProjectRepository: {
    findAllActive: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  },
  ProjectKeyRepository: {
    findActiveByProjectId: vi.fn(),
    create: vi.fn(),
    replaceKey: vi.fn(),
  },
}));

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn(),
}));

const baseProject = {
  id: 'proj-uuid-1',
  account_id: 'account-uuid-1',
  name: 'payments-service',
  application_url: 'https://pay.myapp.com',
  description: 'Payment service logs',
  environment: 'production',
  archived_at: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
};

const baseKey = {
  id: 'key-uuid-1',
  project_id: 'proj-uuid-1',
  public_key: 'aabbccdd'.repeat(8),
  created_at: new Date('2026-01-01T00:00:00Z'),
};

describe('ProjectService.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-01: calls findAllActive and attaches DSN to each project', async () => {
    const { ProjectRepository, ProjectKeyRepository } = await import('../../repositories/index.js');
    const { ProjectService } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findAllActive).mockResolvedValue([baseProject] as never);
    vi.mocked(ProjectKeyRepository.findActiveByProjectId).mockResolvedValue(baseKey as never);

    const results = await ProjectService.list('account-uuid-1');

    expect(ProjectRepository.findAllActive).toHaveBeenCalledWith('account-uuid-1');
    expect(results).toHaveLength(1);
    expect(results[0].dsn).toMatch(/^https:\/\/.+@.+\/.+$/);
    expect(results[0].id).toBe('proj-uuid-1');
  });
});

describe('ProjectService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-02: persists project + key and returns project with correctly formatted DSN', async () => {
    const { ProjectRepository, ProjectKeyRepository } = await import('../../repositories/index.js');
    const crypto = await import('node:crypto');
    const { ProjectService } = await import('../../services/project.js');

    const publicKey = 'aabbccdd'.repeat(8);
    vi.mocked(crypto.randomBytes).mockReturnValue(Buffer.from(publicKey, 'hex') as never);
    vi.mocked(ProjectRepository.create).mockResolvedValue(baseProject as never);
    vi.mocked(ProjectKeyRepository.create).mockResolvedValue(baseKey as never);

    const result = await ProjectService.create('account-uuid-1', {
      name: 'payments-service',
      application_url: 'https://pay.myapp.com',
      description: 'Payment service logs',
      environment: 'production',
    });

    expect(ProjectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: 'account-uuid-1',
        name: 'payments-service',
      }),
    );
    expect(ProjectKeyRepository.create).toHaveBeenCalledWith('proj-uuid-1', expect.any(String));
    expect(result.dsn).toMatch(/^https:\/\/.+@.+\/proj-uuid-1$/);
  });

  it('FR-02: throws ZodError when name is missing', async () => {
    const { ProjectService } = await import('../../services/project.js');

    await expect(
      ProjectService.create('account-uuid-1', {
        name: '',
        application_url: 'https://pay.myapp.com',
        environment: 'production',
      }),
    ).rejects.toThrow();
  });

  it('FR-02: throws ZodError when application_url is not a valid URL', async () => {
    const { ProjectService } = await import('../../services/project.js');

    await expect(
      ProjectService.create('account-uuid-1', {
        name: 'payments-service',
        application_url: 'not-a-url',
        environment: 'production',
      }),
    ).rejects.toThrow();
  });

  it('FR-02: throws ZodError when environment is empty', async () => {
    const { ProjectService } = await import('../../services/project.js');

    await expect(
      ProjectService.create('account-uuid-1', {
        name: 'payments-service',
        application_url: 'https://pay.myapp.com',
        environment: '',
      }),
    ).rejects.toThrow();
  });
});

describe('ProjectService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-03: updates project and returns it with DSN when caller owns it', async () => {
    const { ProjectRepository, ProjectKeyRepository } = await import('../../repositories/index.js');
    const { ProjectService } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue(baseProject as never);
    vi.mocked(ProjectRepository.update).mockResolvedValue({
      ...baseProject,
      name: 'payments-v2',
    } as never);
    vi.mocked(ProjectKeyRepository.findActiveByProjectId).mockResolvedValue(baseKey as never);

    const result = await ProjectService.update('account-uuid-1', 'proj-uuid-1', {
      name: 'payments-v2',
    });

    expect(ProjectRepository.update).toHaveBeenCalledWith(
      'proj-uuid-1',
      expect.objectContaining({ name: 'payments-v2' }),
    );
    expect(result.name).toBe('payments-v2');
    expect(result.dsn).toMatch(/^https:\/\/.+/);
  });

  it('FR-03: throws ProjectForbiddenError when caller does not own the project', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectForbiddenError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue({
      ...baseProject,
      account_id: 'account-uuid-B',
    } as never);

    await expect(
      ProjectService.update('account-uuid-A', 'proj-uuid-1', { name: 'hacked' }),
    ).rejects.toThrow(ProjectForbiddenError);
  });

  it('throws ProjectNotFoundError when project does not exist', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectNotFoundError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue(null);

    await expect(
      ProjectService.update('account-uuid-1', 'nonexistent-id', { name: 'x' }),
    ).rejects.toThrow(ProjectNotFoundError);
  });
});

describe('ProjectService.archive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-04: archives the project when caller owns it', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue(baseProject as never);
    vi.mocked(ProjectRepository.archive).mockResolvedValue(undefined as never);

    await ProjectService.archive('account-uuid-1', 'proj-uuid-1');

    expect(ProjectRepository.archive).toHaveBeenCalledWith('proj-uuid-1');
  });

  it('FR-04: throws ProjectNotFoundError when project does not exist', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectNotFoundError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue(null);

    await expect(ProjectService.archive('account-uuid-1', 'nonexistent-id')).rejects.toThrow(
      ProjectNotFoundError,
    );
  });

  it('throws ProjectForbiddenError when caller does not own the project', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectForbiddenError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue({
      ...baseProject,
      account_id: 'account-uuid-B',
    } as never);

    await expect(ProjectService.archive('account-uuid-A', 'proj-uuid-1')).rejects.toThrow(
      ProjectForbiddenError,
    );
  });
});

describe('ProjectService.rotateKey', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-05: calls replaceKey and returns new DSN with new public_key', async () => {
    const { ProjectRepository, ProjectKeyRepository } = await import('../../repositories/index.js');
    const crypto = await import('node:crypto');
    const { ProjectService } = await import('../../services/project.js');

    const newPublicKey = 'deadbeef'.repeat(8);
    vi.mocked(ProjectRepository.findById).mockResolvedValue(baseProject as never);
    vi.mocked(crypto.randomBytes).mockReturnValue(Buffer.from(newPublicKey, 'hex') as never);
    vi.mocked(ProjectKeyRepository.replaceKey).mockResolvedValue({
      ...baseKey,
      public_key: newPublicKey,
    } as never);

    const result = await ProjectService.rotateKey('account-uuid-1', 'proj-uuid-1');

    expect(ProjectKeyRepository.replaceKey).toHaveBeenCalledWith('proj-uuid-1', newPublicKey);
    expect(result.dsn).toContain(newPublicKey);
    expect(result.dsn).toMatch(/^https:\/\/.+@.+\/proj-uuid-1$/);
  });

  it('throws ProjectNotFoundError when project does not exist', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectNotFoundError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue(null);

    await expect(ProjectService.rotateKey('account-uuid-1', 'nonexistent-id')).rejects.toThrow(
      ProjectNotFoundError,
    );
  });

  it('throws ProjectForbiddenError when caller does not own the project', async () => {
    const { ProjectRepository } = await import('../../repositories/index.js');
    const { ProjectService, ProjectForbiddenError } = await import('../../services/project.js');

    vi.mocked(ProjectRepository.findById).mockResolvedValue({
      ...baseProject,
      account_id: 'account-uuid-B',
    } as never);

    await expect(ProjectService.rotateKey('account-uuid-A', 'proj-uuid-1')).rejects.toThrow(
      ProjectForbiddenError,
    );
  });
});
