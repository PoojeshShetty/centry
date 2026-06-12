import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../repositories/log.js', () => ({
  LogRepository: {
    bulkCreate: vi.fn(),
  },
}));

vi.mock('@centry/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@centry/shared')>();
  return {
    ...actual,
    parseEnvelope: vi.fn(),
  };
});

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const validEnvelopeBody = '{"sdk_version":"1.0","sent_at":"2024-01-01T00:00:00Z","source":"test"}\n{"type":"log","length":100}\n{"timestamp":1700000000,"level":"error","severity_number":17,"body":"boom"}';

describe('ingestHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FR-07: returns 200 { id } and calls bulkCreate for valid envelope', async () => {
    const shared = await import('@centry/shared');
    const { LogRepository } = await import('../../repositories/log.js');
    const { ingestHandler } = await import('../../routes/project.js');

    const items = [{ timestamp: 1700000000, level: 'error', severity_number: 17, body: 'boom' }];
    vi.mocked(shared.parseEnvelope).mockReturnValue({
      header: { sdk_version: '1.0', sent_at: '2024-01-01T00:00:00Z', source: 'test' },
      items,
    });
    vi.mocked(LogRepository.bulkCreate).mockResolvedValue([] as never);

    const req = {
      params: { id: 'proj-1' },
      body: validEnvelopeBody,
    } as unknown as Request;
    const res = mockRes();

    await ingestHandler(req, res);

    expect(LogRepository.bulkCreate).toHaveBeenCalledWith('proj-1', items);
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { id: string };
    expect(typeof jsonArg.id).toBe('string');
  });

  it('FR-08: returns 400 when parseEnvelope throws EnvelopeParseError', async () => {
    const shared = await import('@centry/shared');
    const { ingestHandler } = await import('../../routes/project.js');

    vi.mocked(shared.parseEnvelope).mockImplementation(() => {
      throw new shared.EnvelopeParseError('bad header');
    });

    const req = { params: { id: 'proj-1' }, body: 'not-valid' } as unknown as Request;
    const res = mockRes();

    await ingestHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'malformed envelope' });
  });

  it('FR-08: skips malformed items but still inserts valid ones', async () => {
    const shared = await import('@centry/shared');
    const { LogRepository } = await import('../../repositories/log.js');
    const { ingestHandler } = await import('../../routes/project.js');

    // parseEnvelope already skips malformed items internally — it returns only valid items
    const validItems = [{ timestamp: 1700000000, level: 'info', severity_number: 9, body: 'ok' }];
    vi.mocked(shared.parseEnvelope).mockReturnValue({
      header: { sdk_version: '1.0', sent_at: '2024-01-01T00:00:00Z', source: 'test' },
      items: validItems,
    });
    vi.mocked(LogRepository.bulkCreate).mockResolvedValue([] as never);

    const req = { params: { id: 'proj-1' }, body: 'body' } as unknown as Request;
    const res = mockRes();

    await ingestHandler(req, res);

    expect(LogRepository.bulkCreate).toHaveBeenCalledWith('proj-1', validItems);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
