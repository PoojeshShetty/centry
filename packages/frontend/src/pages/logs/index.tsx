import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { styled } from 'styled-components'
import { useLogStore } from '../../store/useLogStore'
import FilterBar from './FilterBar'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const CenteredMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  gap: 0.75rem;
`

const ErrorText = styled.p`
  color: #ff4d4f;
`

export default function LogsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const { fetchLogs, setFilter, filters, logs, loading, error } = useLogStore()

  // Restore filter state from URL params on mount (FR-17)
  useEffect(() => {
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (level) setFilter('level', level.split(','))
    if (search) setFilter('search', search)
    if (start) setFilter('start', Number(start))
    if (end) setFilter('end', Number(end))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch logs when projectId or filters change (FR-12)
  useEffect(() => {
    if (projectId) fetchLogs(projectId)
  }, [projectId, filters, fetchLogs])

  return (
    <Page>
      <FilterBar />
      {error && (
        <CenteredMessage>
          <ErrorText>Failed to load — retry</ErrorText>
          <button onClick={() => projectId && fetchLogs(projectId)}>Retry</button>
        </CenteredMessage>
      )}
      {!loading && !error && logs.length === 0 && (
        <CenteredMessage>
          <p>No logs found</p>
        </CenteredMessage>
      )}
    </Page>
  )
}
