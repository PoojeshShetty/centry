import { hostname } from 'os';
import type { LogItem } from '@centry/shared';
import { getConfig } from './init.js';
import { parseStack } from './stackTrace.js';
import { traceStore } from './context.js';
import { push } from './buffer.js';
import { SDK_NAME, SDK_VERSION } from './constants.js';

export function captureLog(
  level: string,
  severityNumber: number,
  template: string,
  params?: unknown[],
  attributes?: Record<string, unknown>,
): void {
  try {
    const config = getConfig();

    if (config.enableLogs === false) return;

    let i = 0;
    const body = params && params.length > 0 ? template.replace(/%s/g, () => String(params[i++] ?? '')) : template;

    const sdkAttrs: Record<string, unknown> = {
      'sentry.sdk.name': SDK_NAME,
      'sentry.sdk.version': SDK_VERSION,
      'server.address': hostname(),
      'sentry.message.template': template,
    };

    if (config.environment !== undefined) sdkAttrs['sentry.environment'] = config.environment;
    if (config.release !== undefined) sdkAttrs['sentry.release'] = config.release;
    if (params) {
      params.forEach((p, idx) => {
        sdkAttrs[`sentry.message.parameter.${idx}`] = p;
      });
    }

    if (severityNumber >= 17) {
      const frames = parseStack(new Error().stack ?? '');
      sdkAttrs['error.stack_frames'] = JSON.stringify(frames);
    }

    const mergedAttrs: Record<string, unknown> = { ...sdkAttrs, ...attributes };

    const traceCtx = traceStore.getStore();

    const logItem: LogItem = {
      timestamp: Date.now(),
      level,
      severity_number: severityNumber,
      body,
      ...(traceCtx ? { trace_id: traceCtx.traceId, span_id: traceCtx.spanId } : {}),
      attributes: mergedAttrs,
    };

    const finalLog = config.beforeSendLog ? config.beforeSendLog(logItem) : logItem;
    if (finalLog === null) return;

    push(finalLog);
  } catch {
    // SDK never throws
  }
}
