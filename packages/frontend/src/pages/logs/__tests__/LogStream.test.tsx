import { jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import type { LogItem } from '@centry/shared'

jest.unstable_mockModule('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn((options: { count: number; estimateSize: () => number }) => {
    const size = options.estimateSize()
    const items = Array.from({ length: options.count }, (_, i) => ({
      index: i,
      key: String(i),
      start: i * size,
      size,
    }))
    return {
      getVirtualItems: () => items,
      getTotalSize: () => options.count * size,
      measureElement: jest.fn(),
    }
  }),
}))

jest.unstable_mockModule('../LogRow', () => ({
  default: ({ log, onClick }: { log: LogItem; onClick: (l: LogItem) => void }) => (
    <div data-testid={`log-row-${log.body}`} onClick={() => onClick(log)}>
      {log.body}
    </div>
  ),
}))

const { default: LogStream } = await import('../LogStream')

function makeLog(i: number): LogItem {
  return {
    timestamp: 1700000000 + i,
    level: 'info',
    severity_number: 9,
    body: `Log message ${i}`,
  }
}

describe('LogStream (FR-14)', () => {
  it('renders all virtualised rows', () => {
    const logs = Array.from({ length: 5 }, (_, i) => makeLog(i))
    render(
      <LogStream logs={logs} hasMore={false} onLoadMore={jest.fn()} onRowClick={jest.fn()} />,
    )
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Log message ${i}`)).toBeInTheDocument()
    }
  })

  it('renders nothing when logs is empty', () => {
    render(<LogStream logs={[]} hasMore={false} onLoadMore={jest.fn()} onRowClick={jest.fn()} />)
    expect(screen.queryByTestId(/log-row/)).not.toBeInTheDocument()
  })

  it('calls onRowClick with the log when a row is clicked', () => {
    const onRowClick = jest.fn()
    const logs = [makeLog(0)]
    render(
      <LogStream logs={logs} hasMore={false} onLoadMore={jest.fn()} onRowClick={onRowClick} />,
    )
    fireEvent.click(screen.getByText('Log message 0'))
    expect(onRowClick).toHaveBeenCalledWith(logs[0])
  })

  it('calls onLoadMore when scroll is near the bottom and hasMore is true', () => {
    const onLoadMore = jest.fn()
    const logs = Array.from({ length: 3 }, (_, i) => makeLog(i))
    const { container } = render(
      <LogStream logs={logs} hasMore={true} onLoadMore={onLoadMore} onRowClick={jest.fn()} />,
    )
    const scrollContainer = container.firstChild as HTMLElement
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 850, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true })
    fireEvent.scroll(scrollContainer)
    expect(onLoadMore).toHaveBeenCalled()
  })

  it('does not call onLoadMore when hasMore is false', () => {
    const onLoadMore = jest.fn()
    const logs = Array.from({ length: 3 }, (_, i) => makeLog(i))
    const { container } = render(
      <LogStream logs={logs} hasMore={false} onLoadMore={onLoadMore} onRowClick={jest.fn()} />,
    )
    const scrollContainer = container.firstChild as HTMLElement
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 850, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true })
    fireEvent.scroll(scrollContainer)
    expect(onLoadMore).not.toHaveBeenCalled()
  })
})
