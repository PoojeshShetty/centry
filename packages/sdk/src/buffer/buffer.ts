import type { LogItem } from '@centry/shared';
import { send } from '../transport/transport.js';

const FLUSH_SIZE = 100;
const HARD_CAP = 1000;
const FLUSH_INTERVAL_MS = 5000;

let buffer: LogItem[] = [];
let dropped = 0;

export function push(item: LogItem): void {
  if (buffer.length >= HARD_CAP) {
    dropped++;
    return;
  }
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

export function getDropped(): number {
  return dropped;
}

export function resetForTest(): void {
  buffer = [];
  dropped = 0;
}

export function setBufferForTest(items: LogItem[]): void {
  buffer = [...items];
}

const timer = setInterval(flush, FLUSH_INTERVAL_MS);
timer.unref();

process.once('SIGTERM', async () => {
  await flush();
  process.exit(0);
});

process.once('SIGINT', async () => {
  await flush();
  process.exit(0);
});
