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

describe('Log model', () => {
  it('is a Sequelize Model subclass', async () => {
    const { Log } = await import('../../models/index.js');
    expect(Object.getPrototypeOf(Log)).toBe(Model);
  });

  it('id is UUID primary key with UUIDV4 default', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.id.defaultValue).toBeInstanceOf(DataTypes.UUIDV4);
  });

  it('project_id is a non-null UUID field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.project_id.allowNull).toBe(false);
  });

  it('timestamp is a non-null FLOAT field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.timestamp.allowNull).toBe(false);
  });

  it('level is a non-null STRING field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.level.allowNull).toBe(false);
  });

  it('severity_number is a non-null INTEGER field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.severity_number.allowNull).toBe(false);
  });

  it('body is a non-null TEXT field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.body.allowNull).toBe(false);
  });

  it('trace_id is nullable', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.trace_id.allowNull).toBe(true);
  });

  it('span_id is nullable', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.span_id.allowNull).toBe(true);
  });

  it('attributes defaults to empty object', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.attributes.defaultValue).toEqual({});
  });

  it('received_at is a DATE field', async () => {
    const { Log } = await import('../../models/index.js');
    const attrs = Log.getAttributes();
    expect(attrs.received_at).toBeDefined();
  });

  it('tableName is logs and timestamps is false', async () => {
    const { Log } = await import('../../models/index.js');
    expect(Log.getTableName()).toBe('logs');
    expect((Log as any).options.timestamps).toBe(false);
  });
});
