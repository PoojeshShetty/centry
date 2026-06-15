import type { ParsedDsn } from '../types.js';

export function parseDsn(dsn: string): ParsedDsn {
  let url: URL;
  try {
    url = new URL(dsn);
  } catch {
    throw new Error(`Invalid DSN: "${dsn}" is not a valid URL`);
  }

  const publicKey = url.username;
  if (!publicKey) {
    throw new Error(`Invalid DSN: missing publicKey (username) in "${dsn}"`);
  }

  const host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
  const projectId = url.pathname.replace(/^\//, '');

  return { publicKey, host, projectId };
}
