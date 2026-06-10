import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { appRoutes, type RouteConfig } from '../routes/routes'

/**
 * Render `routes` inside a `MemoryRouter` starting at `initialEntries`. Defaults
 * to the real {@link appRoutes} so tests exercise actual routing; pass `routes`
 * to override. Shared by page tests so the router boilerplate lives in one place.
 */
export function renderPage(initialEntries: string[], routes: RouteConfig[] = appRoutes) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        {routes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </MemoryRouter>,
  )
}
