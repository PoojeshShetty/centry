import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/log.js', () => ({
  Log: {
    bulkCreate: vi.fn(),
    findAll: vi.fn(),
  },
}));

const projectId = 'proj-1';

const makeLogItem = (overrides = {}) => ({
  timestamp: 1700000000,
  level: 'error',
  severity_number: 17,
  body: 'Something went wrong',
  trace_id: null,
  span_id: null,
  attributes: {},
  ...overrides,
});

describe('LogRepository.bulkCreate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls Log.bulkCreate with mapped records and returns results', async () => {
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    const items = [makeLogItem(), makeLogItem({ level: 'info', severity_number: 9 })];
    const inserted = items.map((i) => ({ ...i, id: 'uuid', project_id: projectId, received_at: new Date() }));
    vi.mocked(Log.bulkCreate).mockResolvedValue(inserted as never);

    const result = await LogRepository.bulkCreate(projectId, items);

    expect(Log.bulkCreate).toHaveBeenCalledOnce();
    const callArg = vi.mocked(Log.bulkCreate).mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(callArg).toHaveLength(2);
    expect(callArg[0]).toMatchObject({ project_id: projectId, level: 'error' });
    expect(result).toBe(inserted);
  });
});

describe('LogRepository.findWithFilters', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns rows with nextCursor null and hasMore false when results <= limit', async () => {
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    const rows = [makeLogItem({ id: 'log-1', project_id: projectId })];
    vi.mocked(Log.findAll).mockResolvedValue(rows as never);

    const result = await LogRepository.findWithFilters(projectId, { limit: 50 });

    expect(result.rows).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('sets hasMore true and slices rows when limit+1 rows returned', async () => {
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    const rows = Array.from({ length: 3 }, (_, i) => ({
      ...makeLogItem({ id: `log-${i}`, project_id: projectId }),
      id: `log-${i}`,
    }));
    vi.mocked(Log.findAll).mockResolvedValue(rows as never);

    const result = await LogRepository.findWithFilters(projectId, { limit: 2 });

    expect(result.hasMore).toBe(true);
    expect(result.rows).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
  });

  it('encodes cursor as base64 JSON { ts, id } of last row', async () => {
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    const rows = [
      { ...makeLogItem({ timestamp: 1700000002 }), id: 'log-b', project_id: projectId },
      { ...makeLogItem({ timestamp: 1700000001 }), id: 'log-a', project_id: projectId },
      { ...makeLogItem({ timestamp: 1700000000 }), id: 'log-z', project_id: projectId },
    ];
    vi.mocked(Log.findAll).mockResolvedValue(rows as never);

    const result = await LogRepository.findWithFilters(projectId, { limit: 2 });

    // rows sliced to 2; last of those is index 1
    const decoded = JSON.parse(Buffer.from(result.nextCursor!, 'base64').toString('utf8'));
    expect(decoded).toEqual({ ts: 1700000001, id: 'log-a' });
  });

  it('passes level IN filter to findAll', async () => {
    const { Op } = await import('sequelize');
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    vi.mocked(Log.findAll).mockResolvedValue([] as never);

    await LogRepository.findWithFilters(projectId, { level: ['error', 'fatal'] });

    const callArg = vi.mocked(Log.findAll).mock.calls[0][0] as Record<string, unknown>;
    const where = callArg.where as Record<symbol | string, unknown>;
    expect((where['level'] as Record<symbol, unknown>)[Op.in]).toEqual(['error', 'fatal']);
  });

  it('passes search iLike filter on body', async () => {
    const { Op } = await import('sequelize');
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    vi.mocked(Log.findAll).mockResolvedValue([] as never);

    await LogRepository.findWithFilters(projectId, { search: 'timeout' });

    const callArg = vi.mocked(Log.findAll).mock.calls[0][0] as Record<string, unknown>;
    const where = callArg.where as Record<symbol | string, unknown>;
    expect((where['body'] as Record<symbol, unknown>)[Op.iLike]).toBe('%timeout%');
  });

  it('decodes cursor and adds timestamp/id clause', async () => {
    const { Op } = await import('sequelize');
    const { Log } = await import('../../models/log.js');
    const { LogRepository } = await import('../../repositories/log.js');

    vi.mocked(Log.findAll).mockResolvedValue([] as never);

    const cursor = Buffer.from(JSON.stringify({ ts: 1700000005, id: 'log-x' })).toString('base64');
    await LogRepository.findWithFilters(projectId, { cursor });

    const callArg = vi.mocked(Log.findAll).mock.calls[0][0] as Record<string, unknown>;
    const where = callArg.where as Record<symbol | string, unknown>;
    const andClauses = where[Op.and as unknown as string] as Array<Record<symbol, unknown>>;
    const orClause = andClauses.find((c) => c[Op.or as unknown as symbol]);
    expect(orClause).toBeDefined();
    type OpRecord = Record<symbol, unknown>;
    const orParts = orClause![Op.or as unknown as symbol] as Array<Record<string, unknown>>;
    // first clause: timestamp < ts
    expect((orParts[0]['timestamp'] as OpRecord)[Op.lt]).toBe(1700000005);
    // second clause: timestamp = ts AND id < id
    expect(orParts[1]['timestamp']).toBe(1700000005);
    expect((orParts[1]['id'] as OpRecord)[Op.lt]).toBe('log-x');
  });
});
