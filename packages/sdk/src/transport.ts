import type { LogItem } from '@centry/shared';
import { getConfig } from './init.js';
import { build } from './envelope.js';
import { envelopeUrl } from './urls.js';
import { SDK_NAME, SDK_VERSION } from './constants.js';

export async function send(logs: LogItem[]): Promise<void> {
  let config;
  try {
    config = getConfig();
  } catch {
    return;
  }

  const envelopeStr = build(logs);
  const url = envelopeUrl(config);
  const authHeader = `Sentry sentry_version=7, sentry_client=${SDK_NAME}/${SDK_VERSION}, sentry_key=${config.publicKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: envelopeStr,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': authHeader,
      },
    });

    if (!response.ok) {
      console.error(`${SDK_NAME}: transport error — HTTP ${response.status}`);
    }
  } catch (err) {
    console.error(`${SDK_NAME}: transport error —`, err);
  }
}
