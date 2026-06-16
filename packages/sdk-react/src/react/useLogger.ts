import { useMemo } from 'react';
import { logger } from '../core/logger.js';

export function useLogger(componentName: string): typeof logger {
  return useMemo(() => {
    const bound = {} as typeof logger;
    (Object.keys(logger) as (keyof typeof logger)[]).forEach((level) => {
      bound[level] = (
        template: string,
        params?: unknown[],
        attributes?: Record<string, unknown>,
      ) => {
        logger[level](template, params, { 'component.name': componentName, ...attributes });
      };
    });
    return bound;
  }, [componentName]);
}
