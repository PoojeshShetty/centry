import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('parseDsn', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('parses a valid DSN correctly', async () => {
    const { parseDsn } = await import('./parseDsn.js');
    const result = parseDsn('https://abc123@localhost:3000/proj-uuid');
    expect(result).toEqual({ publicKey: 'abc123', host: 'localhost:3000', projectId: 'proj-uuid' });
  });

  it('throws on missing publicKey', async () => {
    const { parseDsn } = await import('./parseDsn.js');
    expect(() => parseDsn('https://localhost:3000/proj-uuid')).toThrow();
  });

  it('throws on malformed URL', async () => {
    const { parseDsn } = await import('./parseDsn.js');
    expect(() => parseDsn('not-a-url')).toThrow();
  });
});
