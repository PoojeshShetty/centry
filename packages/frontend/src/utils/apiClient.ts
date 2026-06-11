import { useAuthStore } from '../store/useAuthStore'
import type {
  Project,
  ProjectWithDsn,
  CreateProjectInput,
  UpdateProjectPatch,
} from '../store/useProjectStore'

/**
 * Base URL of the backend API. The frontend and backend run on separate origins,
 * so requests are prefixed with `VITE_API_URL` (set per Vite mode, e.g. `.env.dev`).
 * Falls back to '' (same-origin relative paths) when unset — e.g. under Jest.
 */
const API_BASE_URL = import.meta.env?.VITE_API_URL ?? ''

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

  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers })

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

export const projectApi = {
  list: (): Promise<ProjectWithDsn[]> => request<ProjectWithDsn[]>('/api/projects'),

  create: (input: CreateProjectInput): Promise<ProjectWithDsn> =>
    request<ProjectWithDsn>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, patch: UpdateProjectPatch): Promise<ProjectWithDsn> =>
    request<ProjectWithDsn>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  archive: (id: string): Promise<void> =>
    request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  rotateKey: (id: string): Promise<{ dsn: string }> =>
    request<{ dsn: string }>(`/api/projects/${id}/rotate-key`, { method: 'POST' }),
}
