import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { LogItem } from '@centry/shared'

const mockFetchLogs = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
const mockFetchNextPage = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
const mockSetFilter = jest.fn()

const defaultStoreState = {
  logs: [] as LogItem[],
  hasMore: false,
  loading: false,
  error: null as string | null,
  filters: {},
  fetchLogs: mockFetchLogs,
  fetchNextPage: mockFetchNextPage,
  setFilter: mockSetFilter,
}

jest.unstable_mockModule('../../../store/useLogStore', () => ({
  useLogStore: jest.fn(() => defaultStoreState),
}))

jest.unstable_mockModule('../FilterBar', () => ({
  default: () => <div data-testid="filter-bar" />,
}))

jest.unstable_mockModule('../LogStream', () => ({
  default: ({ logs }: { logs: LogItem[] }) => (
    <div data-testid="log-stream">{logs.length} logs</div>
  ),
}))

jest.unstable_mockModule('../LogDetailDrawer', () => ({
  default: () => <div data-testid="log-detail-drawer" />,
}))

const { useLogStore } = await import('../../../store/useLogStore')
const { default: LogsPage } = await import('../index')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/proj-1/logs']}>
      <Routes>
        <Route path="/projects/:projectId/logs" element={<LogsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LogsPage (FR-12, FR-18)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLogStore as jest.Mock).mockReturnValue(defaultStoreState)
  })

  it('renders FilterBar (FR-12)', () => {
    renderPage()
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument()
  })

  it('shows "No logs found" when logs are empty and not loading (FR-18)', () => {
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      logs: [],
      loading: false,
      error: null,
    })
    renderPage()
    expect(screen.getByText('No logs found')).toBeInTheDocument()
  })

  it('does not show "No logs found" while loading', () => {
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      logs: [],
      loading: true,
      error: null,
    })
    renderPage()
    expect(screen.queryByText('No logs found')).not.toBeInTheDocument()
  })

  it('shows error message and retry button when error is set (FR-18)', () => {
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      error: 'Network failure',
    })
    renderPage()
    expect(screen.getByText('Failed to load — retry')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retry button calls fetchLogs with projectId', async () => {
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      error: 'Network failure',
      fetchLogs: mockFetchLogs,
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(mockFetchLogs).toHaveBeenCalledWith('proj-1'))
  })

  it('renders LogStream when logs are present (FR-12)', () => {
    const mockLog: LogItem = { timestamp: 1700000000, level: 'info', severity_number: 9, body: 'hi' }
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      logs: [mockLog],
    })
    renderPage()
    expect(screen.getByTestId('log-stream')).toBeInTheDocument()
    expect(screen.getByText('1 logs')).toBeInTheDocument()
  })

  it('does not show "No logs found" when there are logs', () => {
    const mockLog: LogItem = { timestamp: 1700000000, level: 'info', severity_number: 9, body: 'hi' }
    ;(useLogStore as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      logs: [mockLog],
    })
    renderPage()
    expect(screen.queryByText('No logs found')).not.toBeInTheDocument()
  })

  it('calls fetchLogs with projectId on mount (FR-12)', async () => {
    renderPage()
    await waitFor(() => expect(mockFetchLogs).toHaveBeenCalledWith('proj-1'))
  })
})
