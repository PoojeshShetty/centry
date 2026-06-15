import type { LogItem, EnvelopeHeader } from '@centry/shared';
import { SDK_NAME, SDK_VERSION } from '../utils/constants.js';

export function build(logs: LogItem[]): string {
  const header: EnvelopeHeader = {
    sdk_version: SDK_VERSION,
    sent_at: new Date().toISOString(),
    source: SDK_NAME,
  };

  const lines: string[] = [JSON.stringify(header)];

  for (const log of logs) {
    lines.push(JSON.stringify({ type: 'log', length: 1 }));
    lines.push(JSON.stringify(log));
  }

  return lines.join('\n');
}
