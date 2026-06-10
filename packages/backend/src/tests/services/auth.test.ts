import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/index.js', () => ({
  AccountRepository: {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

const account = {
  id: 'uuid-1',
  name: 'Alice',
  email: 'alice@example.com',
  password_hash: 'hashed',
  created_at: new Date('2026-01-01T00:00:00Z'),
};

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-01: returns { token, user } with no password_hash and stores a hash, not plaintext', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(AccountRepository.create).mockResolvedValue(account as never);
    vi.mocked(jwt.sign).mockReturnValue('signed.jwt' as never);

    const result = await AuthService.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hunter2!',
    });

    expect(result.token).toBe('signed.jwt');
    expect(result.user).toEqual({
      id: 'uuid-1',
      name: 'Alice',
      email: 'alice@example.com',
      created_at: account.created_at,
    });
    expect(result.user).not.toHaveProperty('password_hash');
    const createdWith = vi.mocked(AccountRepository.create).mock.calls[0][0];
    expect(createdWith.password_hash).toBe('hashed');
    expect(createdWith.password_hash).not.toBe('hunter2!');
  });

  it('FR-04: lowercases the email before persisting', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(AccountRepository.create).mockResolvedValue(account as never);
    vi.mocked(jwt.sign).mockReturnValue('signed.jwt' as never);

    await AuthService.register({
      name: 'Alice',
      email: 'Alice@Example.com',
      password: 'hunter2!',
    });

    expect(AccountRepository.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(vi.mocked(AccountRepository.create).mock.calls[0][0].email).toBe('alice@example.com');
  });

  it('FR-02: throws on duplicate email and does not create a second account', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(account as never);

    await expect(
      AuthService.register({ name: 'Alice', email: 'alice@example.com', password: 'hunter2!' }),
    ).rejects.toThrow();
    expect(AccountRepository.create).not.toHaveBeenCalled();
  });

  it('FR-03: rejects an empty name and persists nothing', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const { AuthService } = await import('../../services/auth.js');

    await expect(
      AuthService.register({ name: '', email: 'alice@example.com', password: 'hunter2!' }),
    ).rejects.toThrow();
    expect(AccountRepository.findByEmail).not.toHaveBeenCalled();
    expect(AccountRepository.create).not.toHaveBeenCalled();
  });

  it('FR-03: rejects a password shorter than 8 characters', async () => {
    const { AuthService } = await import('../../services/auth.js');

    await expect(
      AuthService.register({ name: 'Alice', email: 'alice@example.com', password: '1234567' }),
    ).rejects.toThrow();
  });

  it('FR-03: accepts a password of exactly 8 characters', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(AccountRepository.create).mockResolvedValue(account as never);
    vi.mocked(jwt.sign).mockReturnValue('signed.jwt' as never);

    await expect(
      AuthService.register({ name: 'Alice', email: 'alice@example.com', password: 'exactly8' }),
    ).resolves.toMatchObject({ token: 'signed.jwt' });
  });
});

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-04: valid credentials with a mixed-case email return { token, user }', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(account as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue('signed.jwt' as never);

    const result = await AuthService.login({
      email: 'Alice@Example.com',
      password: 'hunter2!',
    });

    expect(AccountRepository.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(result.token).toBe('signed.jwt');
    expect(result.user).not.toHaveProperty('password_hash');
  });

  it('FR-05: unknown email throws "invalid email or password"', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);

    await expect(
      AuthService.login({ email: 'ghost@example.com', password: 'hunter2!' }),
    ).rejects.toThrow('invalid email or password');
  });

  it('FR-05: wrong password throws the same "invalid email or password"', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const { AuthService } = await import('../../services/auth.js');

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(account as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      AuthService.login({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toThrow('invalid email or password');
  });
});

describe('AuthService — credential safety (FR-08)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('never logs the password, hash, or token to console', async () => {
    const { AccountRepository } = await import('../../repositories/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { AuthService } = await import('../../services/auth.js');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(AccountRepository.create).mockResolvedValue(account as never);
    vi.mocked(jwt.sign).mockReturnValue('signed.jwt' as never);

    await AuthService.register({ name: 'Alice', email: 'alice@example.com', password: 'hunter2!' });

    vi.mocked(AccountRepository.findByEmail).mockResolvedValue(null);
    await AuthService.login({ email: 'ghost@example.com', password: 'hunter2!' }).catch(() => {});

    const allArgs = [...logSpy.mock.calls, ...errSpy.mock.calls].flat().map(String).join(' ');
    expect(allArgs).not.toContain('hunter2!');
    expect(allArgs).not.toContain('hashed');
    expect(allArgs).not.toContain('signed.jwt');

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
