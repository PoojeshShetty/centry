import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../models/index.js', () => ({
  ProjectKey: { findOne: vi.fn() },
  Project: { findByPk: vi.fn() },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('requireProjectOwner middleware (FR-06)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 404 when project is not found', async () => {
    const { Project } = await import('../../models/index.js');
    vi.mocked(Project.findByPk).mockResolvedValue(null);

    const { requireProjectOwner } = await import('../../middleware/requireProjectOwner.js');
    const req = {
      params: { id: 'proj-1' },
      accountId: 'account-1',
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when project is owned by a different account', async () => {
    const { Project } = await import('../../models/index.js');
    vi.mocked(Project.findByPk).mockResolvedValue({ account_id: 'account-2' } as never);

    const { requireProjectOwner } = await import('../../middleware/requireProjectOwner.js');
    const req = {
      params: { id: 'proj-1' },
      accountId: 'account-1',
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.project and calls next when account owns the project', async () => {
    const { Project } = await import('../../models/index.js');
    const fakeProject = { id: 'proj-1', account_id: 'account-1' };
    vi.mocked(Project.findByPk).mockResolvedValue(fakeProject as never);

    const { requireProjectOwner } = await import('../../middleware/requireProjectOwner.js');
    const req = {
      params: { id: 'proj-1' },
      accountId: 'account-1',
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireProjectOwner(req, res, next);

    expect((req as any).project).toEqual(fakeProject);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
