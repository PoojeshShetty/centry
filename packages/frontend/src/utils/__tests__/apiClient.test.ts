import { jest } from '@jest/globals'
import { apiClient, ApiRequestError } from '../apiClient'
import { useAuthStore } from '../../store/useAuthStore'

const user = {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('apiClient.request', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
    global.fetch = jest.fn()
  })

  it('attaches Authorization: Bearer <token> when authenticated', async () => {
    useAuthStore.getState().setAuth('tok-abc', user)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })

    await apiClient.request('/api/auth/me')

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer tok-abc')
  })

  it('omits Authorization header when no token is set', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })

    await apiClient.request('/api/auth/me')

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('throws a typed error with message + status on non-2xx, from backend { error }', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'invalid email or password' }),
    })

    await expect(apiClient.request('/api/auth/login', { method: 'POST' })).rejects.toMatchObject({
      message: 'invalid email or password',
      status: 401,
    })
    await expect(
      apiClient.request('/api/auth/login', { method: 'POST' }),
    ).rejects.toBeInstanceOf(ApiRequestError)
  })

  it('returns parsed JSON data on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ token: 'jwt', user }),
    })

    const data = await apiClient.request<{ token: string; user: typeof user }>('/api/auth/register', {
      method: 'POST',
    })
    expect(data.token).toBe('jwt')
    expect(data.user).toEqual(user)
  })
})
