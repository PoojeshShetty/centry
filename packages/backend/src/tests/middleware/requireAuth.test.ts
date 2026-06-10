import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('requireAuth middleware (FR-07)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 401 and does not call next when no Authorization header is present', async () => {
    const { requireAuth } = await import('../../middleware/requireAuth.js');
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the header is not a Bearer token', async () => {
    const { requireAuth } = await import('../../middleware/requireAuth.js');
    const req = { headers: { authorization: 'Basic abc' } } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.accountId and calls next on a valid JWT', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const { requireAuth } = await import('../../middleware/requireAuth.js');

    vi.mocked(jwt.verify).mockReturnValue({ sub: 'uuid-1' } as never);
    const req = { headers: { authorization: 'Bearer good.token' } } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(req.accountId).toBe('uuid-1');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 401 on an expired or tampered token', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const { requireAuth } = await import('../../middleware/requireAuth.js');

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const req = { headers: { authorization: 'Bearer expired.token' } } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
