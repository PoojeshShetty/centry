import type { RouteObject } from 'react-router-dom'
import router from '../index'

function collectPaths(routes: RouteObject[]): (string | undefined)[] {
  return routes.flatMap((r) => [r.path, ...collectPaths(r.children ?? [])])
}

// Confirms the router declares the public auth routes, the protected app routes,
// and the catch-all (FR-15 route wiring).
describe('routes', () => {
  it('declares /login, /register, /, /account, and the catch-all', () => {
    const allPaths = collectPaths(router.routes)
    expect(allPaths).toContain('/')
    expect(allPaths).toContain('/login')
    expect(allPaths).toContain('/register')
    expect(allPaths).toContain('/account')
    expect(allPaths).toContain('*')
  })

  it('declares /projects/:projectId for the project detail page (FR-07)', () => {
    const allPaths = collectPaths(router.routes)
    expect(allPaths).toContain('/projects/:projectId')
  })

  it('does not declare /projects/:projectId/logs (FR-07)', () => {
    const allPaths = collectPaths(router.routes)
    expect(allPaths).not.toContain('/projects/:projectId/logs')
  })
})
