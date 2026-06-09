import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

// Replace AuthService with spies but keep the real error classes so the
// handlers' `instanceof` mapping (409 / 401) still works.
vi.mock('../../services/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/index.js')>();
  return {
    ...actual,
    AuthService: { register: vi.fn(), login: vi.fn() },
  };
});

vi.mock('../../repositories/index.js', () => ({
  AccountRepository: { findById: vi.fn() },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const account = {
  id: 'uuid-1',
  name: 'Alice',
  email: 'alice@example.com',
  password_hash: 'hashed',
  created_at: new Date('2026-01-01T00:00:00Z'),
};

const session = {
  token: 'signed.jwt',
  user: {
    id: account.id,
    name: account.name,
    email: account.email,
    created_at: account.created_at,
  },
};

describe('POST /api/auth/register handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-01: responds 201 with { token, user } and no password_hash on success', async () => {
    const { AuthService } = await import('../../services/index.js');
    const { registerHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.register).mockResolvedValue(session);
    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'hunter2!' } } as Request;
    const res = mockRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(session);
    const payload = vi.mocked(res.json).mock.calls[0][0] as typeof session;
    expect(payload.user).not.toHaveProperty('password_hash');
  });

  it('FR-02: responds 409 { error: "email already registered" } on duplicate email', async () => {
    const { AuthService, DuplicateEmailError } = await import('../../services/index.js');
    const { registerHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.register).mockRejectedValue(new DuplicateEmailError());
    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'hunter2!' } } as Request;
    const res = mockRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'email already registered' });
  });

  it('FR-03: responds 400 with the validation message on invalid input', async () => {
    const { AuthService } = await import('../../services/index.js');
    const { registerHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.register).mockRejectedValue(
      new ZodError([
        { code: 'too_small', minimum: 8, origin: 'string', path: ['password'], message: 'Too short' } as never,
      ]),
    );
    const req = { body: { name: 'Alice', email: 'alice@example.com', password: '123' } } as Request;
    const res = mockRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too short' });
  });
});

describe('POST /api/auth/login handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-04: responds 200 with { token, user } on valid credentials', async () => {
    const { AuthService } = await import('../../services/index.js');
    const { loginHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.login).mockResolvedValue(session);
    const req = { body: { email: 'alice@example.com', password: 'hunter2!' } } as Request;
    const res = mockRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(session);
  });

  it('FR-05: responds 401 { error: "invalid email or password" } on bad credentials', async () => {
    const { AuthService, InvalidCredentialsError } = await import('../../services/index.js');
    const { loginHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.login).mockRejectedValue(new InvalidCredentialsError());
    const req = { body: { email: 'alice@example.com', password: 'wrong' } } as Request;
    const res = mockRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid email or password' });
  });

  it('FR-03: responds 400 on a Zod validation error (missing fields)', async () => {
    const { AuthService } = await import('../../services/index.js');
    const { loginHandler } = await import('../../routes/auth.js');

    vi.mocked(AuthService.login).mockRejectedValue(
      new ZodError([
        { code: 'too_small', minimum: 1, origin: 'string', path: ['email'], message: 'Required' } as never,
      ]),
    );
    const req = { body: { password: 'hunter2!' } } as Request;
    const res = mockRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Required' });
  });
});

describe('GET /api/auth/me handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-06: responds 200 with { id, name, email, created_at } and no password_hash', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const { meHandler } = await import('../../routes/auth.js');

    vi.mocked(AccountRepository.findById).mockResolvedValue(account as never);
    const req = { accountId: 'uuid-1' } as Request;
    const res = mockRes();

    await meHandler(req, res);

    expect(AccountRepository.findById).toHaveBeenCalledWith('uuid-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'uuid-1',
      name: 'Alice',
      email: 'alice@example.com',
      created_at: account.created_at,
    });
    const payload = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('password_hash');
  });

  it('FR-07: responds 401 when the account no longer exists', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const { meHandler } = await import('../../routes/auth.js');

    vi.mocked(AccountRepository.findById).mockResolvedValue(null);
    const req = { accountId: 'missing' } as Request;
    const res = mockRes();

    await meHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
  });
});
