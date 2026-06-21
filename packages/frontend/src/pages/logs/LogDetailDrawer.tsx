import { useState } from 'react'
import { Button, Drawer, Space, Typography, Descriptions } from 'antd'
import { styled } from 'styled-components'
import type { LogItem } from '@centry/shared'
import { theme } from '../../theme'

const Section = styled.div`
  margin-bottom: 1.5rem;
`

const SectionLabel = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  color: ${theme.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`

const BodyText = styled.pre`
  background: ${theme.app.elevated};
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
`

const RawJson = styled.pre`
  background: ${theme.bg.app};
  color: ${theme.text.primary};
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0;
  font-size: 0.75rem;
  overflow: auto;
  max-height: 300px;
  font-family: monospace;
`

interface LogDetailDrawerProps {
  log: LogItem | null
  onClose: () => void
}

export default function LogDetailDrawer({ log, onClose }: LogDetailDrawerProps) {
  const [showRaw, setShowRaw] = useState(false)

  const attributes = log?.attributes ?? {}
  const attrEntries = Object.entries(attributes)

  return (
    <Drawer
      title="Log Detail"
      open={log !== null}
      onClose={onClose}
      width={520}
      keyboard
      maskClosable
    >
      {log && (
        <>
          <Section>
            <SectionLabel>Message</SectionLabel>
            <BodyText>{log.body}</BodyText>
          </Section>

          {(log.trace_id || log.span_id) && (
            <Section>
              <SectionLabel>Trace</SectionLabel>
              <Space orientation="vertical" style={{ width: '100%' }}>
                {log.trace_id && (
                  <Typography.Text copyable={{ text: log.trace_id }} style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    trace: {log.trace_id}
                  </Typography.Text>
                )}
                {log.span_id && (
                  <Typography.Text copyable={{ text: log.span_id }} style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    span: {log.span_id}
                  </Typography.Text>
                )}
              </Space>
            </Section>
          )}

          {attrEntries.length > 0 && (
            <Section>
              <SectionLabel>Attributes</SectionLabel>
              <Descriptions bordered size="small" column={1}>
                {attrEntries.map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Section>
          )}

          <Section>
            <Button size="small" onClick={() => setShowRaw((s) => !s)}>
              {showRaw ? 'Hide' : 'Show'} raw JSON
            </Button>
            {showRaw && <RawJson style={{ marginTop: '0.75rem' }}>{JSON.stringify(log, null, 2)}</RawJson>}
          </Section>
        </>
      )}
    </Drawer>
  )
}
