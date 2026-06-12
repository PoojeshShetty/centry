import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { LogItem } from '@centry/shared'

const { default: LogDetailDrawer } = await import('../LogDetailDrawer')

const mockLog: LogItem = {
  timestamp: 1700000000,
  level: 'error',
  severity_number: 17,
  body: 'Something went wrong',
  trace_id: 'trace-abc-123',
  span_id: 'span-xyz-789',
  attributes: { userId: 'u1', region: 'us-east-1' },
}

describe('LogDetailDrawer (FR-16)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does not render content when log is null', () => {
    render(<LogDetailDrawer log={null} onClose={jest.fn()} />)
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('renders log body when log is provided', async () => {
    render(<LogDetailDrawer log={mockLog} onClose={jest.fn()} />)
    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeInTheDocument())
  })

  it('renders trace_id and span_id', async () => {
    render(<LogDetailDrawer log={mockLog} onClose={jest.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/trace-abc-123/)).toBeInTheDocument()
      expect(screen.getByText(/span-xyz-789/)).toBeInTheDocument()
    })
  })

  it('renders attribute key-value pairs', async () => {
    render(<LogDetailDrawer log={mockLog} onClose={jest.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('userId')).toBeInTheDocument()
      expect(screen.getByText('u1')).toBeInTheDocument()
      expect(screen.getByText('region')).toBeInTheDocument()
      expect(screen.getByText('us-east-1')).toBeInTheDocument()
    })
  })

  it('shows raw JSON when "Show raw JSON" is clicked', async () => {
    render(<LogDetailDrawer log={mockLog} onClose={jest.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /show raw json/i }))
    fireEvent.click(screen.getByRole('button', { name: /show raw json/i }))
    expect(screen.getByRole('button', { name: /hide raw json/i })).toBeInTheDocument()
  })

  it('calls onClose when the drawer close button is clicked', async () => {
    const onClose = jest.fn()
    render(<LogDetailDrawer log={mockLog} onClose={onClose} />)
    await waitFor(() => screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Esc key is pressed', async () => {
    const onClose = jest.fn()
    render(<LogDetailDrawer log={mockLog} onClose={onClose} />)
    await waitFor(() => screen.getByText('Something went wrong'))
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
