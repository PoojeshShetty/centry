import type { ResolvedConfig } from '../types.js';

export function envelopeUrl(config: ResolvedConfig): string {
  return `https://${config.host}/api/${config.projectId}/envelope/`;
}
