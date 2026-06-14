import { describe, it, expect } from 'vitest';
import { build } from './envelope.js';
import { parseEnvelope } from '@centry/shared';
import type { LogItem } from '@centry/shared';

const makeLog = (overrides: Partial<LogItem> = {}): LogItem => ({
  timestamp: 1_700_000_000_000,
  level: 'info',
  severity_number: 9,
  body: 'test message',
  ...overrides,
});

describe('envelope.build', () => {
  it('produces exactly 5 lines for 2 items', () => {
    const result = build([makeLog(), makeLog()]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(5);
  });

  it('produces exactly 3 lines for 1 item', () => {
    const result = build([makeLog()]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('has no trailing newline', () => {
    const result = build([makeLog()]);
    expect(result.endsWith('\n')).toBe(false);
  });

  it('line 1 is valid JSON with sent_at and sdk_version', () => {
    const result = build([makeLog()]);
    const header = JSON.parse(result.split('\n')[0]);
    expect(header).toHaveProperty('sent_at');
    expect(header).toHaveProperty('sdk_version');
    expect(typeof header.sent_at).toBe('string');
    expect(new Date(header.sent_at).toISOString()).toBe(header.sent_at);
  });

  it('each item-header line has type "log" and length 1', () => {
    const result = build([makeLog(), makeLog()]);
    const lines = result.split('\n');
    const itemHeader1 = JSON.parse(lines[1]);
    const itemHeader2 = JSON.parse(lines[3]);
    expect(itemHeader1).toMatchObject({ type: 'log', length: 1 });
    expect(itemHeader2).toMatchObject({ type: 'log', length: 1 });
  });

  it('each item-payload line matches the original LogItem', () => {
    const log1 = makeLog({ body: 'first', level: 'warn' });
    const log2 = makeLog({ body: 'second', level: 'error' });
    const result = build([log1, log2]);
    const lines = result.split('\n');
    expect(JSON.parse(lines[2])).toEqual(log1);
    expect(JSON.parse(lines[4])).toEqual(log2);
  });

  it('is compatible with parseEnvelope — items round-trip correctly', () => {
    const log1 = makeLog({ body: 'hello', trace_id: 'abc' });
    const log2 = makeLog({ body: 'world', level: 'error', severity_number: 17 });
    const result = build([log1, log2]);
    const parsed = parseEnvelope(result);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({ body: 'hello', trace_id: 'abc' });
    expect(parsed.items[1]).toMatchObject({ body: 'world', level: 'error' });
  });
});
