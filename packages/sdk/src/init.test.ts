import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('init and getConfig', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('getConfig throws before init is called', async () => {
    const { getConfig } = await import('./init.js');
    expect(() => getConfig()).toThrow('call init() before using logger');
  });

  it('init stores config and getConfig returns it', async () => {
    const { init, getConfig } = await import('./init.js');
    init({ dsn: 'https://abc123@localhost:3000/proj-uuid' });
    const config = getConfig();
    expect(config.publicKey).toBe('abc123');
    expect(config.host).toBe('localhost:3000');
    expect(config.projectId).toBe('proj-uuid');
    expect(config.dsn).toBe('https://abc123@localhost:3000/proj-uuid');
  });

  it('second init call is a no-op and warns', async () => {
    const { init, getConfig } = await import('./init.js');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    init({ dsn: 'https://keyA@localhost:3000/proj-A' });
    init({ dsn: 'https://keyB@localhost:3000/proj-B' });

    const config = getConfig();
    expect(config.publicKey).toBe('keyA');
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
  });

  it('init throws on invalid DSN', async () => {
    const { init } = await import('./init.js');
    expect(() => init({ dsn: 'https://localhost:3000/proj' })).toThrow();
  });
});
