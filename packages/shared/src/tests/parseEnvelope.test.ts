import { describe, it, expect } from 'vitest';
import { parseEnvelope, EnvelopeParseError } from '../index.js';

const header = JSON.stringify({ sdk_version: '1.0.0', sent_at: '2024-01-01T00:00:00Z', source: 'node' });
const itemHeader = JSON.stringify({ type: 'log', length: 0 });
const payload = JSON.stringify({
  timestamp: 1704067200,
  level: 'error',
  severity_number: 17,
  body: 'Something went wrong',
});

describe('parseEnvelope', () => {
  it('happy path: parses a valid 3-line envelope', () => {
    const raw = [header, itemHeader, payload].join('\n');
    const result = parseEnvelope(raw);

    expect(result.header).toMatchObject({ sdk_version: '1.0.0', source: 'node' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      timestamp: 1704067200,
      level: 'error',
      severity_number: 17,
      body: 'Something went wrong',
    });
  });

  it('throws EnvelopeParseError when the first line is not valid JSON', () => {
    const raw = ['not-json', itemHeader, payload].join('\n');
    expect(() => parseEnvelope(raw)).toThrow(EnvelopeParseError);
  });

  it('returns empty items when envelope has only a header line', () => {
    const result = parseEnvelope(header);
    expect(result.header).toMatchObject({ sdk_version: '1.0.0' });
    expect(result.items).toHaveLength(0);
  });

  it('silently skips an item pair whose payload fails JSON.parse', () => {
    const raw = [header, itemHeader, 'not-valid-json'].join('\n');
    const result = parseEnvelope(raw);
    expect(result.items).toHaveLength(0);
  });
});
