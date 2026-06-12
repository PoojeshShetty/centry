import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { styled } from 'styled-components'
import type { LogItem } from '@centry/shared'
import LogRow from './LogRow'

const Container = styled.div`
  margin-top: 3rem;
  height: calc(100vh - 3rem);
  overflow-y: scroll;
  overflow-x: hidden;
`

interface LogStreamProps {
  logs: LogItem[]
  hasMore: boolean
  onLoadMore: () => void
  onRowClick: (log: LogItem) => void
}

export default function LogStream({ logs, hasMore, onLoadMore, onRowClick }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 60,
    overscan: 5,
  })

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (hasMore && scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore()
    }
  }

  return (
    <Container ref={containerRef} onScroll={handleScroll}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              left: 0,
              width: '100%',
            }}
          >
            <LogRow log={logs[virtualRow.index]} onClick={onRowClick} />
          </div>
        ))}
      </div>
    </Container>
  )
}
