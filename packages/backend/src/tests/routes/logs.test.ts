import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../repositories/log.js', () => ({
  LogRepository: {
    findWithFilters: vi.fn(),
  },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const sampleLog = {
  id: 'log-1',
  project_id: 'proj-1',
  timestamp: 1700000000,
  level: 'error',
  severity_number: 17,
  body: 'Something failed',
  trace_id: null,
  span_id: null,
  attributes: {},
  received_at: new Date(),
};

describe('queryHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-09/FR-10: returns 200 { logs, nextCursor, hasMore } for happy path', async () => {
    const { LogRepository } = await import('../../repositories/log.js');
    const { queryHandler } = await import('../../routes/project.js');

    vi.mocked(LogRepository.findWithFilters).mockResolvedValue({
      rows: [sampleLog],
      nextCursor: null,
      hasMore: false,
    } as never);

    const req = {
      params: { id: 'proj-1' },
      query: {},
    } as unknown as Request;
    const res = mockRes();

    await queryHandler(req, res);

    expect(LogRepository.findWithFilters).toHaveBeenCalledWith('proj-1', expect.objectContaining({ limit: 50 }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ logs: [sampleLog], nextCursor: null, hasMore: false });
  });

  it('FR-09/FR-10: parses level comma-separated query param', async () => {
    const { LogRepository } = await import('../../repositories/log.js');
    const { queryHandler } = await import('../../routes/project.js');

    vi.mocked(LogRepository.findWithFilters).mockResolvedValue({ rows: [], nextCursor: null, hasMore: false } as never);

    const req = {
      params: { id: 'proj-1' },
      query: { level: 'error,fatal' },
    } as unknown as Request;
    const res = mockRes();

    await queryHandler(req, res);

    expect(LogRepository.findWithFilters).toHaveBeenCalledWith(
      'proj-1',
      expect.objectContaining({ level: ['error', 'fatal'] }),
    );
  });

  it('FR-09/FR-10: passes cursor, search, start, end, limit to repository', async () => {
    const { LogRepository } = await import('../../repositories/log.js');
    const { queryHandler } = await import('../../routes/project.js');

    vi.mocked(LogRepository.findWithFilters).mockResolvedValue({ rows: [], nextCursor: null, hasMore: false } as never);

    const cursor = Buffer.from(JSON.stringify({ ts: 1700000000, id: 'log-x' })).toString('base64');
    const req = {
      params: { id: 'proj-1' },
      query: {
        cursor,
        search: 'timeout',
        start: '1699999000',
        end: '1700001000',
        limit: '100',
      },
    } as unknown as Request;
    const res = mockRes();

    await queryHandler(req, res);

    expect(LogRepository.findWithFilters).toHaveBeenCalledWith(
      'proj-1',
      expect.objectContaining({
        cursor,
        search: 'timeout',
        start: 1699999000,
        end: 1700001000,
        limit: 100,
      }),
    );
  });

  it('caps limit at 200', async () => {
    const { LogRepository } = await import('../../repositories/log.js');
    const { queryHandler } = await import('../../routes/project.js');

    vi.mocked(LogRepository.findWithFilters).mockResolvedValue({ rows: [], nextCursor: null, hasMore: false } as never);

    const req = {
      params: { id: 'proj-1' },
      query: { limit: '999' },
    } as unknown as Request;
    const res = mockRes();

    await queryHandler(req, res);

    expect(LogRepository.findWithFilters).toHaveBeenCalledWith(
      'proj-1',
      expect.objectContaining({ limit: 200 }),
    );
  });
});
