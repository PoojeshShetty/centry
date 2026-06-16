import type { LogItem } from '@centry/shared';
import { send } from '../transport/transport.js';
import { getConfig } from '../core/init.js';
import { build } from '../transport/envelope.js';
import { envelopeUrl } from '../transport/urls.js';

const FLUSH_SIZE = 100;
const FLUSH_INTERVAL_MS = 5000;

let buffer: LogItem[] = [];

export function push(item: LogItem): void {
  buffer.push(item);
  if (buffer.length >= FLUSH_SIZE) {
    flush();
  }
}

export async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  await send(batch);
}

export function beacon(): void {
  if (buffer.length === 0) return;
  const config = getConfig();
  if (!config) return;
  const envelopeStr = build(buffer);
  const url = envelopeUrl(config);
  navigator.sendBeacon(url, envelopeStr);
  buffer = [];
}

export function resetForTest(): void {
  buffer = [];
}

export function setBufferForTest(items: LogItem[]): void {
  buffer = [...items];
}

if (typeof window !== 'undefined') {
  setInterval(flush, FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', beacon);
}
