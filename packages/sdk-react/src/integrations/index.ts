import { installGlobalErrors } from './globalErrors.js';
import { installFetch } from './fetch.js';
import { installXhr } from './xhr.js';
import { installNavigation } from './navigation.js';

export function installIntegrations(): void {
  installGlobalErrors();
  installFetch();
  installXhr();
  installNavigation();
}
