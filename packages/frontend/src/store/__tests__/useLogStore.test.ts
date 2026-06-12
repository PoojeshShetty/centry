import { jest } from '@jest/globals'
import type { LogItem } from '@centry/shared'
import type { LogFilters, LogQueryResponse } from '../../api/logApi'

const mockLogApi = {
  query: jest.fn<(projectId: string, filters: LogFilters) => Promise<LogQueryResponse>>(),
}

jest.unstable_mockModule('../../api/logApi', () => ({
  logApi: mockLogApi,
}))

const { useLogStore } = await import('../useLogStore')

const mockLog: LogItem = {
  timestamp: 1700000000,
  level: 'error',
  severity_number: 17,
  body: 'test error message',
}

describe('useLogStore', () => {
  beforeEach(() => {
    useLogStore.setState({
      logs: [],
      filters: {},
      nextCursor: null,
      hasMore: false,
      loading: false,
      error: null,
    })
    jest.clearAllMocks()
  })

  describe('setFilter (FR-13)', () => {
    it('updates the specified filter key', () => {
      useLogStore.getState().setFilter('level', ['error'])
      expect(useLogStore.getState().filters.level).toEqual(['error'])
    })

    it('resets logs and nextCursor on filter change', () => {
      useLogStore.setState({ logs: [mockLog], nextCursor: 'cursor-abc' })
      useLogStore.getState().setFilter('search', 'timeout')
      expect(useLogStore.getState().logs).toEqual([])
      expect(useLogStore.getState().nextCursor).toBeNull()
    })
  })

  describe('resetFilters', () => {
    it('clears filters, logs, and nextCursor', () => {
      useLogStore.setState({ filters: { level: ['error'] }, logs: [mockLog], nextCursor: 'abc' })
      useLogStore.getState().resetFilters()
      expect(useLogStore.getState().filters).toEqual({})
      expect(useLogStore.getState().logs).toEqual([])
      expect(useLogStore.getState().nextCursor).toBeNull()
    })
  })

  describe('fetchLogs (FR-12)', () => {
    it('calls logApi.query with projectId and current filters', async () => {
      mockLogApi.query.mockResolvedValue({ logs: [mockLog], nextCursor: null, hasMore: false })
      useLogStore.setState({ filters: { level: ['error'] } })

      await useLogStore.getState().fetchLogs('proj-1')

      expect(mockLogApi.query).toHaveBeenCalledWith('proj-1', { level: ['error'] })
    })

    it('sets loading to true during fetch', async () => {
      let resolve!: (v: LogQueryResponse) => void
      mockLogApi.query.mockReturnValue(new Promise((r) => { resolve = r }))

      const promise = useLogStore.getState().fetchLogs('proj-1')
      expect(useLogStore.getState().loading).toBe(true)

      resolve({ logs: [], nextCursor: null, hasMore: false })
      await promise
      expect(useLogStore.getState().loading).toBe(false)
    })

    it('updates logs, nextCursor, and hasMore on success', async () => {
      mockLogApi.query.mockResolvedValue({ logs: [mockLog], nextCursor: 'cursor-1', hasMore: true })

      await useLogStore.getState().fetchLogs('proj-1')

      const state = useLogStore.getState()
      expect(state.logs).toEqual([mockLog])
      expect(state.nextCursor).toBe('cursor-1')
      expect(state.hasMore).toBe(true)
    })

    it('sets error and clears loading on failure', async () => {
      mockLogApi.query.mockRejectedValue(new Error('network error'))

      await useLogStore.getState().fetchLogs('proj-1')

      expect(useLogStore.getState().error).toBe('network error')
      expect(useLogStore.getState().loading).toBe(false)
    })
  })

  describe('fetchNextPage', () => {
    it('skips fetch when hasMore is false', async () => {
      useLogStore.setState({ hasMore: false, nextCursor: 'cursor-1' })

      await useLogStore.getState().fetchNextPage('proj-1')

      expect(mockLogApi.query).not.toHaveBeenCalled()
    })

    it('skips fetch when nextCursor is null', async () => {
      useLogStore.setState({ hasMore: true, nextCursor: null })

      await useLogStore.getState().fetchNextPage('proj-1')

      expect(mockLogApi.query).not.toHaveBeenCalled()
    })

    it('appends logs and updates pagination state on success', async () => {
      const existing: LogItem = { ...mockLog, body: 'existing log' }
      const nextPage: LogItem = { ...mockLog, body: 'next page log' }
      useLogStore.setState({ logs: [existing], nextCursor: 'cursor-1', hasMore: true, filters: {} })
      mockLogApi.query.mockResolvedValue({ logs: [nextPage], nextCursor: null, hasMore: false })

      await useLogStore.getState().fetchNextPage('proj-1')

      const state = useLogStore.getState()
      expect(state.logs).toEqual([existing, nextPage])
      expect(state.nextCursor).toBeNull()
      expect(state.hasMore).toBe(false)
    })

    it('passes cursor from state when fetching next page', async () => {
      useLogStore.setState({ hasMore: true, nextCursor: 'cursor-42', filters: { level: ['warn'] } })
      mockLogApi.query.mockResolvedValue({ logs: [], nextCursor: null, hasMore: false })

      await useLogStore.getState().fetchNextPage('proj-1')

      expect(mockLogApi.query).toHaveBeenCalledWith('proj-1', { level: ['warn'], cursor: 'cursor-42' })
    })
  })
})
