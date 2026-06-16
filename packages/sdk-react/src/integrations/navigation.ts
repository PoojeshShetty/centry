import { logger } from '../core/logger.js';

let patched = false;

const originalPushState = typeof history !== 'undefined' ? history.pushState.bind(history) : null;

function onPopstate() {
  const navUrl = window.location.pathname;
  logger.info(`Navigated to ${navUrl}`, [], { 'navigation.url': navUrl });
}

export function resetForTest(): void {
  patched = false;
  if (originalPushState !== null) {
    history.pushState = originalPushState;
  }
  window.removeEventListener('popstate', onPopstate);
}

export function installNavigation(): void {
  if (patched) return;
  if (typeof window === 'undefined') return;
  patched = true;

  history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
    originalPushState!(data, unused, url);
    const navUrl = typeof url === 'string' ? url : url instanceof URL ? url.pathname : window.location.pathname;
    logger.info(`Navigated to ${navUrl}`, [], { 'navigation.url': navUrl });
  };

  window.addEventListener('popstate', onPopstate);
}
