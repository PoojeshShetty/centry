import { styled } from 'styled-components'

const Panel = styled.div`
  height: 100%;
  min-height: 100vh;
  background: #0a1628;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  overflow: hidden;
`

const Headline = styled.h2`
  color: #e2e8f0;
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
`

const Sub = styled.p`
  color: #64748b;
  font-size: 0.9375rem;
  margin: 0 0 2.5rem;
`

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`

const LogRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
`

type Level = 'info' | 'warn' | 'error' | 'debug' | 'fatal' | 'trace'

const levelColors: Record<Level, { bg: string; text: string }> = {
  info:  { bg: '#0c2a6e', text: '#60a5fa' },
  warn:  { bg: '#3b2200', text: '#fbbf24' },
  error: { bg: '#3b0a0a', text: '#f87171' },
  debug: { bg: '#1e1040', text: '#c084fc' },
  fatal: { bg: '#2d0000', text: '#ff6b6b' },
  trace: { bg: '#1a1a1a', text: '#94a3b8' },
}

const Badge = styled.span<{ $level: Level }>`
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: ${({ $level }) => levelColors[$level].bg};
  color: ${({ $level }) => levelColors[$level].text};
  margin-top: 1px;
`

const Message = styled.span`
  font-size: 0.8125rem;
  color: #94a3b8;
  line-height: 1.4;
`

const Time = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #334155;
  margin-left: auto;
  margin-top: 2px;
`

interface LogEntry {
  level: Level
  message: string
  time: string
}

const entries: LogEntry[] = [
  { level: 'info',  message: 'Server started on port 3000',            time: '09:41:01' },
  { level: 'debug', message: 'Cache warmed — 12,847 entries loaded',   time: '09:41:03' },
  { level: 'info',  message: 'User alice@example.com authenticated',   time: '09:41:17' },
  { level: 'warn',  message: 'Rate limit at 80% for /api/ingest',      time: '09:41:34' },
  { level: 'error', message: 'Payment webhook failed: upstream 502',   time: '09:41:55' },
  { level: 'info',  message: 'Deploy completed in 4.2 s',              time: '09:42:10' },
  { level: 'fatal', message: 'OOM in worker — heap exhausted',         time: '09:42:31' },
  { level: 'trace', message: 'GET /api/logs → 200 (38 ms)',            time: '09:42:44' },
]

export function AuthRightPanel() {
  return (
    <Panel>
      <Headline>Log everything.{'\n'}Know everything.</Headline>
      <Sub>Real-time visibility into your application.</Sub>
      <LogList>
        {entries.map((e, i) => (
          <LogRow key={i}>
            <Badge $level={e.level}>{e.level}</Badge>
            <Message>{e.message}</Message>
            <Time>{e.time}</Time>
          </LogRow>
        ))}
      </LogList>
    </Panel>
  )
}

export default AuthRightPanel
