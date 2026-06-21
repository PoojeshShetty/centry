import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { Button, Space, Typography, message } from 'antd'
import { useProjectStore } from '../../store/useProjectStore'
import { useLogStore } from '../../store/useLogStore'
import type { LogItem } from '@centry/shared'
import FilterBar from '../logs/FilterBar'
import LogStream from '../logs/LogStream'
import LogDetailDrawer from '../logs/LogDetailDrawer'
import { theme } from '../../theme'

const Page = styled.div`
  background: ${theme.app.bg};
  min-height: 100%;
  padding: 1.5rem;
  color: ${theme.app.text};
`

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.app.textSecondary};
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &:hover {
    color: ${theme.app.text};
  }
`

const InfoSection = styled.section`
  background: ${theme.app.surface};
  border: 1px solid ${theme.app.border};
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`

const ProjectName = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.app.text};
  margin: 0 0 0.75rem 0;
`

const MetaRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`

const MetaItem = styled.span`
  font-size: 0.875rem;
  color: ${theme.app.textSecondary};
`

const EnvBadge = styled.span`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${theme.app.elevated};
  border: 1px solid ${theme.app.border};
  color: ${theme.app.text};
`

const DsnSection = styled.section`
  background: ${theme.app.surface};
  border: 1px solid ${theme.app.border};
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`

const DsnLabel = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  color: ${theme.app.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const DsnValue = styled(Typography.Text)`
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  display: block;
  margin-bottom: 0.75rem;
  color: ${theme.app.text};
`

const LogSection = styled.section`
  background: ${theme.app.bg};
  border: 1px solid ${theme.app.border};
  border-radius: 8px;
  overflow: hidden;
`

const CenteredMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  gap: 0.75rem;
  color: ${theme.app.textSecondary};
`

function maskDsn(dsn: string): string {
  return dsn.replace(/:\/\/[^@]+@/, '://••••••••@')
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const { projects, fetchProjects, rotateKey } = useProjectStore()
  const { fetchLogs, fetchNextPage, filters, logs, hasMore, loading, error } = useLogStore()

  const project = projects.find((p) => p.id === projectId) ?? null
  const dsn = project?.dsn ?? ''
  const displayDsn = revealed ? dsn : maskDsn(dsn)

  useEffect(() => {
    if (projects.length === 0) fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (projectId) fetchLogs(projectId)
  }, [projectId, filters, fetchLogs])

  function handleCopy() {
    navigator.clipboard.writeText(dsn).then(() => {
      message.success('DSN copied to clipboard')
    })
  }

  async function handleRotate() {
    if (projectId) {
      setRevealed(false)
      await rotateKey(projectId)
    }
  }

  return (
    <Page>
      <BackLink onClick={() => navigate('/projects')}>← Projects</BackLink>

      {project && (
        <>
          <InfoSection>
            <ProjectName>{project.name}</ProjectName>
            <MetaRow>
              <EnvBadge>{project.environment}</EnvBadge>
              <MetaItem>{project.application_url}</MetaItem>
              <MetaItem>{new Date(project.created_at).toLocaleDateString()}</MetaItem>
            </MetaRow>
          </InfoSection>

          <DsnSection>
            <DsnLabel>DSN</DsnLabel>
            <DsnValue>{displayDsn}</DsnValue>
            <Space>
              <Button size="small" onClick={handleCopy}>
                Copy
              </Button>
              <Button size="small" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Hide' : 'Reveal'}
              </Button>
              <Button danger size="small" onClick={handleRotate}>
                Rotate key
              </Button>
            </Space>
          </DsnSection>
        </>
      )}

      <LogSection>
        <FilterBar />
        {error && (
          <CenteredMessage>
            <p>Failed to load — retry</p>
            <button onClick={() => projectId && fetchLogs(projectId)}>Retry</button>
          </CenteredMessage>
        )}
        {!loading && !error && logs.length === 0 && (
          <CenteredMessage>
            <p>No logs found</p>
          </CenteredMessage>
        )}
        {!error && logs.length > 0 && (
          <LogStream
            logs={logs}
            hasMore={hasMore}
            onLoadMore={() => projectId && fetchNextPage(projectId)}
            onRowClick={setSelectedLog}
          />
        )}
      </LogSection>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </Page>
  )
}
