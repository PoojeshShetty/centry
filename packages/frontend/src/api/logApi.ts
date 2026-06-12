import { apiClient } from '../utils/apiClient'
import type { LogItem } from '@centry/shared'

export interface LogFilters {
  level?: string[]
  search?: string
  start?: number
  end?: number
  cursor?: string
  limit?: number
}

export interface LogQueryResponse {
  logs: LogItem[]
  nextCursor: string | null
  hasMore: boolean
}

function filtersToQuery(filters: LogFilters): string {
  const params = new URLSearchParams()
  if (filters.level?.length) params.set('level', filters.level.join(','))
  if (filters.search) params.set('search', filters.search)
  if (filters.start !== undefined) params.set('start', String(filters.start))
  if (filters.end !== undefined) params.set('end', String(filters.end))
  if (filters.cursor) params.set('cursor', filters.cursor)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const logApi = {
  query: (projectId: string, filters: LogFilters = {}): Promise<LogQueryResponse> =>
    apiClient.request<LogQueryResponse>(
      `/api/projects/${projectId}/logs${filtersToQuery(filters)}`,
    ),
}
