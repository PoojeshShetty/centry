import { styled } from 'styled-components'
import type { LogItem } from '@centry/shared'
import { theme } from '../../theme'

interface LevelStyle {
  bg: string
  text: string
  border: string
}

function levelStyle(level: string): LevelStyle {
  return theme.severity[level.toLowerCase() as keyof typeof theme.severity] ?? theme.severity.trace
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
  border-bottom: 1px solid ${theme.border.subtle};
  cursor: pointer;
  &:hover {
    border: 1px solid ${theme.bg.hover};
  }
`

const Timestamp = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: ${theme.text.secondary};
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
  color: ${theme.app.text};
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
