import { captureLog } from './captureLog.js';

function makeMethod(level: string, severityNumber: number) {
  return (template: string, params?: unknown[], attributes?: Record<string, unknown>): void => {
    try {
      captureLog(level, severityNumber, template, params, attributes);
    } catch {
      // SDK never throws
    }
  };
}

export const logger = {
  trace: makeMethod('trace', 1),
  debug: makeMethod('debug', 5),
  info: makeMethod('info', 9),
  warn: makeMethod('warn', 13),
  error: makeMethod('error', 17),
  fatal: makeMethod('fatal', 21),
};
