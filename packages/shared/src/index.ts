export enum SeverityLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogItem {
  timestamp: number;
  level: string;
  severity_number: number;
  body: string;
  trace_id?: string;
  span_id?: string;
  attributes?: Record<string, unknown>;
}

export interface EnvelopeHeader {
  sdk_version: string;
  sent_at: string;
  source: string;
}

export interface Envelope {
  header: EnvelopeHeader;
  items: LogItem[];
}

export class EnvelopeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvelopeParseError';
  }
}

export function parseEnvelope(raw: string): Envelope {
  const lines = raw.split('\n').filter((l) => l.trim() !== '');

  let header: EnvelopeHeader;
  try {
    header = JSON.parse(lines[0]) as EnvelopeHeader;
  } catch {
    throw new EnvelopeParseError(`Failed to parse envelope header: ${lines[0]}`);
  }

  const items: LogItem[] = [];
  // Process remaining lines in pairs: item-header + payload
  for (let i = 1; i < lines.length - 1; i += 2) {
    try {
      items.push(JSON.parse(lines[i + 1]) as LogItem);
    } catch {
      // silently skip malformed item pairs
    }
  }

  return { header, items };
}
