import { jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../../store/useAuthStore'

jest.mock('../../routes', () => ({ default: { navigate: jest.fn() } }))

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

describe('useTokenExpiryCheck', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('logs out when an expired token is detected on the interval tick', async () => {
    const { useTokenExpiryCheck } = await import('../useTokenExpiryCheck')
    const expiredToken = makeJwt(Math.floor(Date.now() / 1000) - 60)
    useAuthStore.getState().setAuth(expiredToken, user)

    renderHook(() => useTokenExpiryCheck())

    act(() => {
      jest.advanceTimersByTime(60_000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('does not log out when token is still valid', async () => {
    const { useTokenExpiryCheck } = await import('../useTokenExpiryCheck')
    const validToken = makeJwt(Math.floor(Date.now() / 1000) + 3600)
    useAuthStore.getState().setAuth(validToken, user)

    renderHook(() => useTokenExpiryCheck())

    act(() => {
      jest.advanceTimersByTime(60_000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('does not start interval when there is no token', async () => {
    const { useTokenExpiryCheck } = await import('../useTokenExpiryCheck')

    renderHook(() => useTokenExpiryCheck())

    act(() => {
      jest.advanceTimersByTime(60_000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
