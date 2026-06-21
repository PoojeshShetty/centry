import { jest } from '@jest/globals'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { message } from 'antd'
import type { RouteObject } from 'react-router-dom'
import { useProjectStore } from '../../../store/useProjectStore'
import { useLogStore } from '../../../store/useLogStore'
import { renderPage } from '../../../utils/testUtils'
import ProjectDetailPage from '../ProjectDetailPage'

const mockProject = {
  id: 'p1',
  name: 'Project Alpha',
  application_url: 'https://alpha.example.com',
  description: null,
  environment: 'production',
  created_at: '2026-01-01T00:00:00.000Z',
  dsn: 'https://abc123def456@localhost:3000/p1',
}

const routes: RouteObject[] = [{ path: '/projects/:projectId', element: <ProjectDetailPage /> }]

function renderDetail(projectId = 'p1') {
  return renderPage([`/projects/${projectId}`], routes)
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [mockProject],
      fetchProjects: jest.fn() as any,
      rotateKey: jest.fn().mockResolvedValue(undefined) as any,
    })
    useLogStore.setState({
      logs: [],
      filters: {},
      hasMore: false,
      loading: false,
      error: null,
      fetchLogs: jest.fn() as any,
      fetchNextPage: jest.fn() as any,
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
    jest.spyOn(message, 'success').mockImplementation((() => null) as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders project name and back link (FR-05, FR-10)', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('Project Alpha')).toBeInTheDocument())
    expect(screen.getByText(/← Projects/)).toBeInTheDocument()
  })

  it('renders environment badge and application URL (FR-05)', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('production')).toBeInTheDocument())
    expect(screen.getByText('https://alpha.example.com')).toBeInTheDocument()
  })

  it('masks DSN by default (FR-05)', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText(/••••••••/)).toBeInTheDocument())
    expect(screen.queryByText(mockProject.dsn)).not.toBeInTheDocument()
  })

  it('Reveal toggles DSN to plaintext, Hide masks it again (FR-05)', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('button', { name: /reveal/i }))
    fireEvent.click(screen.getByRole('button', { name: /reveal/i }))
    expect(screen.getByText(mockProject.dsn)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /hide/i }))
    expect(screen.queryByText(mockProject.dsn)).not.toBeInTheDocument()
    expect(screen.getByText(/••••••••/)).toBeInTheDocument()
  })

  it('Copy calls clipboard.writeText with full DSN (FR-05)', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('button', { name: /copy/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProject.dsn)
  })

  it('Rotate key calls rotateKey and resets revealed state (FR-05)', async () => {
    const rotateMock = jest.fn().mockResolvedValue(undefined) as any
    useProjectStore.setState({ rotateKey: rotateMock })
    renderDetail()
    await waitFor(() => screen.getByRole('button', { name: /reveal/i }))
    fireEvent.click(screen.getByRole('button', { name: /reveal/i }))
    expect(screen.getByText(mockProject.dsn)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /rotate key/i }))
    await waitFor(() => expect(rotateMock).toHaveBeenCalledWith('p1'))
    expect(screen.queryByText(mockProject.dsn)).not.toBeInTheDocument()
  })

  it('shows "No logs found" when log store is empty (FR-05)', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText(/no logs found/i)).toBeInTheDocument())
  })

  it('calls fetchProjects when projects array is empty (FR-05)', async () => {
    const fetchMock = jest.fn() as any
    useProjectStore.setState({ projects: [], fetchProjects: fetchMock })
    renderDetail()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})
