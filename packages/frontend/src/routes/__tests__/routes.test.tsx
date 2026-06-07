import router from '../index'

// Harness stub: confirms Jest resolves the router module from src/routes/ and
// that the stub routes are declared.
describe('routes', () => {
  it('declares the root and catch-all routes', () => {
    const paths = router.routes.map((r) => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('*')
  })
})
