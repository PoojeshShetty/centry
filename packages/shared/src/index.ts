/**
 * @centry/shared — canonical types and the envelope parsing utility shared
 * across the SDK, backend, and frontend packages.
 */

/** Log severity, ordered from least to most severe. */
export enum SeverityLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/** Arbitrary key-value metadata attached to a log item. */
export type Attribute = Record<string, string | number | boolean>;

/** A single log entry. */
export interface LogItem {
  /** ISO-8601 timestamp. */
  timestamp: string;
  severity: SeverityLevel;
  message: string;
  attributes?: Attribute;
}

/** Metadata describing the origin of an envelope. */
export interface EnvelopeHeader {
  sdk_version: string;
  /** ISO-8601 timestamp. */
  sent_at: string;
  /** Source of the envelope, e.g. 'browser' | 'node'. */
  source: string;
}

/** A batch of log items with their transport header. */
export interface Envelope {
  header: EnvelopeHeader;
  items: LogItem[];
}

/** Thrown by {@link parseEnvelope} when input cannot be parsed into an Envelope. */
export class EnvelopeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvelopeParseError';
  }
}

/**
 * Parse an unknown value into a validated {@link Envelope}.
 *
 * Stub for the scaffold milestone — real validation is deferred to M1.
 *
 * @throws {EnvelopeParseError} always, until implemented.
 */
export function parseEnvelope(raw: unknown): Envelope {
  void raw;
  throw new EnvelopeParseError('Not implemented');
}
