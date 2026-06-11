import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

vi.mock('../../services/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/index.js')>();
  return {
    ...actual,
    ProjectService: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      rotateKey: vi.fn(),
    },
  };
});

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

const projectWithDsn = {
  id: 'proj-1',
  account_id: 'acc-1',
  name: 'My App',
  application_url: 'https://myapp.com',
  description: null,
  environment: 'production',
  archived_at: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  dsn: 'https://abc123@localhost:3000/proj-1',
};

describe('GET /api/projects handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-01: responds 200 with project list', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { listHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.list).mockResolvedValue([projectWithDsn]);
    const req = { accountId: 'acc-1' } as Request;
    const res = mockRes();

    await listHandler(req, res);

    expect(ProjectService.list).toHaveBeenCalledWith('acc-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([projectWithDsn]);
  });
});

describe('POST /api/projects handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-02: responds 201 with project + dsn', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { createHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.create).mockResolvedValue(projectWithDsn);
    const req = {
      accountId: 'acc-1',
      body: { name: 'My App', application_url: 'https://myapp.com', environment: 'production' },
    } as Request;
    const res = mockRes();

    await createHandler(req, res);

    expect(ProjectService.create).toHaveBeenCalledWith('acc-1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(projectWithDsn);
  });

  it('responds 400 on ZodError', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { createHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.create).mockRejectedValue(
      new ZodError([
        { code: 'too_small', minimum: 1, origin: 'string', path: ['name'], message: 'name required' } as never,
      ]),
    );
    const req = { accountId: 'acc-1', body: {} } as Request;
    const res = mockRes();

    await createHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'name required' });
  });
});

describe('PATCH /api/projects/:id handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-03: responds 403 when ProjectForbiddenError thrown', async () => {
    const { ProjectService, ProjectForbiddenError } = await import('../../services/index.js');
    const { updateHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.update).mockRejectedValue(new ProjectForbiddenError());
    const req = { accountId: 'acc-1', params: { id: 'proj-1' }, body: { name: 'New' } } as unknown as Request;
    const res = mockRes();

    await updateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'forbidden' });
  });

  it('responds 404 when ProjectNotFoundError thrown', async () => {
    const { ProjectService, ProjectNotFoundError } = await import('../../services/index.js');
    const { updateHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.update).mockRejectedValue(new ProjectNotFoundError());
    const req = { accountId: 'acc-1', params: { id: 'missing' }, body: { name: 'New' } } as unknown as Request;
    const res = mockRes();

    await updateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not found' });
  });

  it('responds 200 with updated project on success', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { updateHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.update).mockResolvedValue({ ...projectWithDsn, name: 'New' });
    const req = { accountId: 'acc-1', params: { id: 'proj-1' }, body: { name: 'New' } } as unknown as Request;
    const res = mockRes();

    await updateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ...projectWithDsn, name: 'New' });
  });
});

describe('DELETE /api/projects/:id handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-04: responds 204 on successful archive', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { archiveHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.archive).mockResolvedValue(undefined);
    const req = { accountId: 'acc-1', params: { id: 'proj-1' } } as unknown as Request;
    const res = mockRes();

    await archiveHandler(req, res);

    expect(ProjectService.archive).toHaveBeenCalledWith('acc-1', 'proj-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('responds 403 when ProjectForbiddenError thrown', async () => {
    const { ProjectService, ProjectForbiddenError } = await import('../../services/index.js');
    const { archiveHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.archive).mockRejectedValue(new ProjectForbiddenError());
    const req = { accountId: 'acc-1', params: { id: 'proj-1' } } as unknown as Request;
    const res = mockRes();

    await archiveHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'forbidden' });
  });
});

describe('POST /api/projects/:id/rotate-key handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-05: responds 200 with { dsn }', async () => {
    const { ProjectService } = await import('../../services/index.js');
    const { rotateKeyHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.rotateKey).mockResolvedValue({ dsn: 'https://newkey@localhost:3000/proj-1' });
    const req = { accountId: 'acc-1', params: { id: 'proj-1' } } as unknown as Request;
    const res = mockRes();

    await rotateKeyHandler(req, res);

    expect(ProjectService.rotateKey).toHaveBeenCalledWith('acc-1', 'proj-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ dsn: 'https://newkey@localhost:3000/proj-1' });
  });

  it('responds 404 when ProjectNotFoundError thrown', async () => {
    const { ProjectService, ProjectNotFoundError } = await import('../../services/index.js');
    const { rotateKeyHandler } = await import('../../routes/project.js');

    vi.mocked(ProjectService.rotateKey).mockRejectedValue(new ProjectNotFoundError());
    const req = { accountId: 'acc-1', params: { id: 'missing' } } as unknown as Request;
    const res = mockRes();

    await rotateKeyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not found' });
  });
});
