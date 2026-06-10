import { useAuthStore } from '../store/useAuthStore'

/** Error thrown for any non-2xx response; carries the backend message + HTTP status. */
export class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

/**
 * Thin `fetch` wrapper. Attaches `Authorization: Bearer <token>` when the auth
 * store holds a token, sends/parses JSON, and turns a non-2xx response into a
 * typed {@link ApiRequestError} carrying the backend `{ error }` message.
 */
async function request<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const { token } = useAuthStore.getState()

  const headers = new Headers(opts.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...opts, headers })

  const data = (await res.json().catch(() => null)) as unknown

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : res.statusText) || 'request failed'
    throw new ApiRequestError(message, res.status)
  }

  return data as T
}

export const apiClient = { request }
