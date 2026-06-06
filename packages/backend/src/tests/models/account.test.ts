import { describe, it, expect, vi } from 'vitest';
import { DataTypes, Model } from 'sequelize';

vi.mock('../../config/sequelize.js', async () => {
  const { Sequelize } = await import('sequelize');
  return {
    sequelize: new Sequelize({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test',
      logging: false,
    }),
  };
});

describe('Account model', () => {
  it('is a Sequelize Model subclass', async () => {
    const { Account } = await import('../../models/index.js');
    expect(Object.getPrototypeOf(Account)).toBe(Model);
  });

  it('id is UUID primary key with UUIDV4 default', async () => {
    const { Account } = await import('../../models/index.js');
    const attrs = Account.getAttributes();
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.id.defaultValue).toBeInstanceOf(DataTypes.UUIDV4);
  });

  it('name is a non-null string field', async () => {
    const { Account } = await import('../../models/index.js');
    const attrs = Account.getAttributes();
    expect(attrs.name.allowNull).toBe(false);
  });

  it('has created_at but no updated_at', async () => {
    const { Account } = await import('../../models/index.js');
    const attrs = Account.getAttributes();
    expect(attrs.created_at).toBeDefined();
    expect(Object.keys(attrs)).not.toContain('updatedAt');
    expect(Object.keys(attrs)).not.toContain('updated_at');
  });
});
