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

describe('Project model', () => {
  it('is a Sequelize Model subclass', async () => {
    const { Project } = await import('../../models/index.js');
    expect(Object.getPrototypeOf(Project)).toBe(Model);
  });

  it('id is UUID primary key with UUIDV4 default', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.id.defaultValue).toBeInstanceOf(DataTypes.UUIDV4);
  });

  it('account_id is a non-null UUID field', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.account_id.allowNull).toBe(false);
  });

  it('name is a non-null string field', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.name.allowNull).toBe(false);
  });

  it('application_url is a non-null string field', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.application_url.allowNull).toBe(false);
  });

  it('description is nullable', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.description.allowNull).toBe(true);
  });

  it('environment is a non-null string field', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.environment.allowNull).toBe(false);
  });

  it('archived_at is nullable', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.archived_at.allowNull).toBe(true);
  });

  it('has created_at and updated_at timestamps', async () => {
    const { Project } = await import('../../models/index.js');
    const attrs = Project.getAttributes();
    expect(attrs.created_at).toBeDefined();
    expect(attrs.updated_at).toBeDefined();
  });
});
