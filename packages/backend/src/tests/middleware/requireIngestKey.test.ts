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

describe('requireIngestKey middleware (FR-05)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 401 when X-Sentry-Auth header is missing', async () => {
    const { requireIngestKey } = await import('../../middleware/requireIngestKey.js');
    const req = { headers: {}, params: { id: 'proj-1' } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireIngestKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when sentry_key is not found in the header', async () => {
    const { requireIngestKey } = await import('../../middleware/requireIngestKey.js');
    const req = {
      headers: { 'x-sentry-auth': 'Sentry sentry_version=7' },
      params: { id: 'proj-1' },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireIngestKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when sentry_key does not match any ProjectKey', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    vi.mocked(ProjectKey.findOne).mockResolvedValue(null);

    const { requireIngestKey } = await import('../../middleware/requireIngestKey.js');
    const req = {
      headers: { 'x-sentry-auth': 'Sentry sentry_key=unknown-key' },
      params: { id: 'proj-1' },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireIngestKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when the key belongs to a different project', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    vi.mocked(ProjectKey.findOne).mockResolvedValue({ project_id: 'proj-2' } as never);

    const { requireIngestKey } = await import('../../middleware/requireIngestKey.js');
    const req = {
      headers: { 'x-sentry-auth': 'Sentry sentry_key=valid-key' },
      params: { id: 'proj-1' },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireIngestKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.project and calls next on a valid matching key', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    const fakeProjectKey = { project_id: 'proj-1', project: { id: 'proj-1' } };
    vi.mocked(ProjectKey.findOne).mockResolvedValue(fakeProjectKey as never);

    const { requireIngestKey } = await import('../../middleware/requireIngestKey.js');
    const req = {
      headers: { 'x-sentry-auth': 'Sentry sentry_key=valid-key' },
      params: { id: 'proj-1' },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireIngestKey(req, res, next);

    expect((req as any).project).toEqual({ id: 'proj-1' });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
