import { jest } from '@jest/globals'
import { useAuthStore, isTokenExpired } from '../useAuthStore'

const TOKEN_KEY = 'centry.auth.token'
const USER_KEY = 'centry.auth.user'

function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: '1', exp }))
  return `${header}.${payload}.sig`
}

const user = {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
  })

  it('setAuth updates state and persists token + user to localStorage (FR-10)', () => {
    useAuthStore.getState().setAuth('jwt-123', user)

    const state = useAuthStore.getState()
    expect(state.token).toBe('jwt-123')
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-123')
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(user)
  })

  it('logout resets state and clears localStorage token key (FR-14)', () => {
    useAuthStore.getState().setAuth('jwt-123', user)

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it('initialises from localStorage on first load (survives refresh)', async () => {
    localStorage.setItem(TOKEN_KEY, 'persisted-tok')
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    jest.resetModules()
    const mod = await import('../useAuthStore')

    const state = mod.useAuthStore.getState()
    expect(state.token).toBe('persisted-tok')
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clears an expired token from localStorage on load', async () => {
    const expiredToken = makeJwt(Math.floor(Date.now() / 1000) - 60)
    localStorage.setItem(TOKEN_KEY, expiredToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    jest.resetModules()
    const mod = await import('../useAuthStore')

    const state = mod.useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('isTokenExpired', () => {
  it('returns true for a token with an exp in the past', () => {
    expect(isTokenExpired(makeJwt(Math.floor(Date.now() / 1000) - 1))).toBe(true)
  })

  it('returns false for a token with an exp in the future', () => {
    expect(isTokenExpired(makeJwt(Math.floor(Date.now() / 1000) + 3600))).toBe(false)
  })

  it('returns false for a malformed token', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(false)
  })
})
