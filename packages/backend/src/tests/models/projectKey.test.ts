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

describe('ProjectKey model', () => {
  it('is a Sequelize Model subclass', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    expect(Object.getPrototypeOf(ProjectKey)).toBe(Model);
  });

  it('id is UUID primary key with UUIDV4 default', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    const attrs = ProjectKey.getAttributes();
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.id.defaultValue).toBeInstanceOf(DataTypes.UUIDV4);
  });

  it('project_id is a non-null UUID field', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    const attrs = ProjectKey.getAttributes();
    expect(attrs.project_id.allowNull).toBe(false);
  });

  it('public_key is a non-null unique string field', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    const attrs = ProjectKey.getAttributes();
    expect(attrs.public_key.allowNull).toBe(false);
    expect(attrs.public_key.unique).toBe(true);
  });

  it('has created_at and updated_at timestamps', async () => {
    const { ProjectKey } = await import('../../models/index.js');
    const attrs = ProjectKey.getAttributes();
    expect(attrs.created_at).toBeDefined();
    expect(attrs.updated_at).toBeDefined();
  });
});
