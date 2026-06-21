import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { appRoutes } from '../routes/routes'

/**
 * Render `routes` inside a memory router starting at `initialEntries`. Defaults
 * to the real {@link appRoutes}; pass `routes` to override with a simpler tree.
 * Supports nested (layout) routes via `createMemoryRouter`.
 */
export function renderPage(initialEntries: string[], routes: RouteObject[] = appRoutes) {
  const router = createMemoryRouter(routes, { initialEntries })
  return render(<RouterProvider router={router} />)
}
