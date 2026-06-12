import router from '../index'

// Confirms the router declares the public auth routes, the protected app routes,
// and the catch-all (FR-15 route wiring).
describe('routes', () => {
  it('declares /login, /register, /, /account, and the catch-all', () => {
    const paths = router.routes.map((r) => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/login')
    expect(paths).toContain('/register')
    expect(paths).toContain('/account')
    expect(paths).toContain('*')
  })

  it('declares /projects/:projectId/logs for the logs explorer (FR-12)', () => {
    const paths = router.routes.map((r) => r.path)
    expect(paths).toContain('/projects/:projectId/logs')
  })
})
