import { describe, it, expect, beforeEach } from 'vitest';

describe('sequelize singleton', () => {
  beforeEach(() => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
  });

  it('uses postgres dialect', async () => {
    const { sequelize } = await import('../../config/sequelize.js');
    expect(sequelize.getDialect()).toBe('postgres');
  });

  it('reads DB_NAME from environment', async () => {
    const { sequelize } = await import('../../config/sequelize.js');
    expect((sequelize as unknown as { config: { database: string } }).config.database).toBe('testdb');
  });
});
