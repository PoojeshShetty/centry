import { jest } from '@jest/globals'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'

const mockSetFilter = jest.fn()
const mockResetFilters = jest.fn()

jest.unstable_mockModule('../../../store/useLogStore', () => ({
  useLogStore: jest.fn(() => ({
    filters: {},
    setFilter: mockSetFilter,
    resetFilters: mockResetFilters,
  })),
}))

const { default: FilterBar } = await import('../FilterBar')

/** Captures the current search params so tests can assert on URL state. */
let capturedSearchParams: URLSearchParams = new URLSearchParams()
function SearchParamsCapture() {
  const [params] = useSearchParams()
  capturedSearchParams = params
  return null
}

function renderFilterBar(initialPath = '/projects/test-proj/logs') {
  capturedSearchParams = new URLSearchParams()
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/projects/:projectId/logs"
          element={
            <>
              <FilterBar />
              <SearchParamsCapture />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FilterBar (FR-13)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('layout', () => {
    it('Bar has position sticky (not fixed)', () => {
      const { container } = renderFilterBar()
      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ position: 'sticky' })
    })
  })

  describe('level pills', () => {
    it('renders all 7 level pills', () => {
      renderFilterBar()
      for (const level of ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']) {
        expect(screen.getByRole('button', { name: new RegExp(`^${level}$`) })).toBeInTheDocument()
      }
    })

    it('clicking ERROR pill calls setFilter with ["error"] and updates URL', () => {
      renderFilterBar()
      fireEvent.click(screen.getByRole('button', { name: /^ERROR$/ }))

      expect(mockSetFilter).toHaveBeenCalledWith('level', ['error'])
      expect(capturedSearchParams.get('level')).toBe('error')
    })

    it('clicking ALL pill calls setFilter with undefined and removes level from URL', () => {
      renderFilterBar('/projects/test-proj/logs?level=error')
      fireEvent.click(screen.getByRole('button', { name: /^ALL$/ }))

      expect(mockSetFilter).toHaveBeenCalledWith('level', undefined)
      expect(capturedSearchParams.get('level')).toBeNull()
    })
  })

  describe('search input', () => {
    it('renders a search input', () => {
      renderFilterBar()
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('does not call setFilter before 300 ms debounce', () => {
      renderFilterBar()
      fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'timeout' } })

      act(() => jest.advanceTimersByTime(200))
      expect(mockSetFilter).not.toHaveBeenCalled()
    })

    it('calls setFilter with search value after 300 ms debounce', () => {
      renderFilterBar()
      fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'timeout' } })

      act(() => jest.advanceTimersByTime(300))
      expect(mockSetFilter).toHaveBeenCalledWith('search', 'timeout')
    })

    it('updates URL with search param after debounce', () => {
      renderFilterBar()
      fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'timeout' } })

      act(() => jest.advanceTimersByTime(300))
      expect(capturedSearchParams.get('search')).toBe('timeout')
    })
  })

  describe('time-range presets', () => {
    it('renders 1h, 6h, 24h, 7d preset buttons', () => {
      renderFilterBar()
      for (const label of ['1h', '6h', '24h', '7d']) {
        expect(screen.getByRole('button', { name: new RegExp(`^${label}$`) })).toBeInTheDocument()
      }
    })
  })
})
