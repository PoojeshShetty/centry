import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/account.js', () => ({
  Account: {
    create: vi.fn(),
    findOne: vi.fn(),
    findByPk: vi.fn(),
  },
}));

describe('AccountRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create persists and returns the Account', async () => {
    const { Account } = await import('../../models/account.js');
    const { AccountRepository } = await import('../../repositories/account.js');
    const row = {
      id: 'uuid-1',
      name: 'Alice',
      email: 'alice@example.com',
      created_at: new Date(),
    };
    vi.mocked(Account.create).mockResolvedValue(row as never);

    const result = await AccountRepository.create({
      name: 'Alice',
      email: 'alice@example.com',
      password_hash: 'hash',
    });

    expect(Account.create).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password_hash: 'hash',
    });
    expect(result).toBe(row);
  });

  it('findByEmail returns null for an unknown email', async () => {
    const { Account } = await import('../../models/account.js');
    const { AccountRepository } = await import('../../repositories/account.js');
    vi.mocked(Account.findOne).mockResolvedValue(null);

    const result = await AccountRepository.findByEmail('ghost@example.com');

    expect(Account.findOne).toHaveBeenCalledWith({ where: { email: 'ghost@example.com' } });
    expect(result).toBeNull();
  });

  it('findByEmail returns the Account for a known email', async () => {
    const { Account } = await import('../../models/account.js');
    const { AccountRepository } = await import('../../repositories/account.js');
    const row = { id: 'uuid-1', email: 'alice@example.com' };
    vi.mocked(Account.findOne).mockResolvedValue(row as never);

    const result = await AccountRepository.findByEmail('alice@example.com');

    expect(result).toBe(row);
  });

  it('findById returns null for an unknown id', async () => {
    const { Account } = await import('../../models/account.js');
    const { AccountRepository } = await import('../../repositories/account.js');
    vi.mocked(Account.findByPk).mockResolvedValue(null);

    const result = await AccountRepository.findById('missing');

    expect(Account.findByPk).toHaveBeenCalledWith('missing');
    expect(result).toBeNull();
  });

  it('findById returns the Account for a known id', async () => {
    const { Account } = await import('../../models/account.js');
    const { AccountRepository } = await import('../../repositories/account.js');
    const row = { id: 'uuid-1', name: 'Alice' };
    vi.mocked(Account.findByPk).mockResolvedValue(row as never);

    const result = await AccountRepository.findById('uuid-1');

    expect(result).toBe(row);
  });
});
