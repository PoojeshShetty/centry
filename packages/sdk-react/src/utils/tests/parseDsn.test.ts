import { describe, it, expect } from 'vitest';
import { parseDsn } from '../parseDsn.js';

describe('parseDsn', () => {
  it('parses a valid DSN correctly', () => {
    const result = parseDsn('http://key@host/42');
    expect(result).toEqual({ publicKey: 'key', host: 'host', projectId: '42' });
  });

  it('parses DSN with port in host', () => {
    const result = parseDsn('https://abc123@localhost:3000/proj-uuid');
    expect(result).toEqual({ publicKey: 'abc123', host: 'localhost:3000', projectId: 'proj-uuid' });
  });

  it('throws on missing publicKey', () => {
    expect(() => parseDsn('https://localhost:3000/proj-uuid')).toThrow();
  });

  it('throws on malformed URL', () => {
    expect(() => parseDsn('not-a-dsn')).toThrow();
  });
});
