import { styled } from 'styled-components'
import type { LogItem } from '@centry/shared'

interface LevelStyle {
  bg: string
  text: string
  border: string
}

const LEVEL_COLORS: Record<string, LevelStyle> = {
  trace: { bg: '#f5f5f5', text: '#8c8c8c', border: '#d9d9d9' },
  debug: { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' },
  info: { bg: '#e6f4ff', text: '#1677ff', border: '#91caff' },
  warn: { bg: '#fffbe6', text: '#d48806', border: '#ffe58f' },
  error: { bg: '#fff2f0', text: '#ff4d4f', border: '#ffccc7' },
  fatal: { bg: '#fff1f0', text: '#a8071a', border: '#ffa39e' },
}

const DEFAULT_LEVEL_STYLE: LevelStyle = { bg: '#f0f0f0', text: '#595959', border: '#d9d9d9' }

function levelStyle(level: string): LevelStyle {
  return LEVEL_COLORS[level.toLowerCase()] ?? DEFAULT_LEVEL_STYLE
}

function relativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp * 1000) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function toIso(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  &:hover {
    background: #fafafa;
  }
`

const Timestamp = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #8c8c8c;
  font-family: monospace;
  min-width: 6rem;
`

const LevelBadge = styled.span<{ $style: LevelStyle }>`
  flex-shrink: 0;
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid ${({ $style }) => $style.border};
  background: ${({ $style }) => $style.bg};
  color: ${({ $style }) => $style.text};
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-width: 3.5rem;
  text-align: center;
`

const Body = styled.span`
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.875rem;
  color: #262626;
  font-family: monospace;
`

interface LogRowProps {
  log: LogItem
  onClick: (log: LogItem) => void
}

export default function LogRow({ log, onClick }: LogRowProps) {
  const ls = levelStyle(log.level)
  return (
    <Row onClick={() => onClick(log)}>
      <Timestamp title={toIso(log.timestamp)}>{relativeTime(log.timestamp)}</Timestamp>
      <LevelBadge $style={ls}>{log.level}</LevelBadge>
      <Body>{log.body}</Body>
    </Row>
  )
}
