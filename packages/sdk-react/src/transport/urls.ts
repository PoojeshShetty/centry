import type { ResolvedConfig } from '../types.js';

export function envelopeUrl(config: ResolvedConfig): string {
  return `http://${config.host}/api/projects/${config.projectId}/envelope/`;
}
