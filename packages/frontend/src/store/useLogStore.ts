import { create } from 'zustand'
import { logApi, type LogFilters } from '../api/logApi'
import type { LogItem } from '@centry/shared'

interface LogState {
  logs: LogItem[]
  filters: LogFilters
  nextCursor: string | null
  hasMore: boolean
  loading: boolean
  error: string | null
  fetchLogs: (projectId: string) => Promise<void>
  fetchNextPage: (projectId: string) => Promise<void>
  setFilter: <K extends keyof LogFilters>(key: K, value: LogFilters[K]) => void
  resetFilters: () => void
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  filters: {},
  nextCursor: null,
  hasMore: false,
  loading: false,
  error: null,

  fetchLogs: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const { filters } = get()
      const { logs, nextCursor, hasMore } = await logApi.query(projectId, filters)
      set({ logs, nextCursor, hasMore, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchNextPage: async (projectId) => {
    const { nextCursor, loading, hasMore, logs, filters } = get()
    if (loading || !hasMore || !nextCursor) return
    set({ loading: true, error: null })
    try {
      const response = await logApi.query(projectId, { ...filters, cursor: nextCursor })
      set({
        logs: [...logs, ...response.logs],
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      logs: [],
      nextCursor: null,
    }))
  },

  resetFilters: () => {
    set({ filters: {}, logs: [], nextCursor: null })
  },
}))
