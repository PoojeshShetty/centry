import { jest } from '@jest/globals'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { Modal } from 'antd'
import { useAuthStore } from '../../../store/useAuthStore'
import { useProjectStore } from '../../../store/useProjectStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

const user = {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

const mockProjects = [
  {
    id: 'p1',
    name: 'Project Alpha',
    application_url: 'https://alpha.example.com',
    description: null,
    environment: 'production',
    created_at: '2026-01-01T00:00:00.000Z',
    dsn: 'https://aaa111@localhost:3000/p1',
  },
  {
    id: 'p2',
    name: 'Project Beta',
    application_url: 'https://beta.example.com',
    description: null,
    environment: 'staging',
    created_at: '2026-02-01T00:00:00.000Z',
    dsn: 'https://bbb222@localhost:3000/p2',
  },
  {
    id: 'p3',
    name: 'Project Gamma',
    application_url: 'https://gamma.example.com',
    description: null,
    environment: 'development',
    created_at: '2026-03-01T00:00:00.000Z',
    dsn: 'https://ccc333@localhost:3000/p3',
  },
]

describe('ProjectsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: 'jwt-123', user, isAuthenticated: true })
    useProjectStore.setState({
      projects: [],
      selectedProject: null,
      isLoading: false,
      error: null,
      fetchProjects: jest.fn() as any,
    })
  })

  it('renders 3 ProjectCards when store has 3 projects (FR-08)', async () => {
    useProjectStore.setState({ projects: mockProjects, fetchProjects: jest.fn() as any })
    renderPage([paths.projects])

    await waitFor(() => expect(screen.getByText('Project Alpha')).toBeInTheDocument())
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
    expect(screen.getByText('Project Gamma')).toBeInTheDocument()
    expect(screen.getByText('https://alpha.example.com')).toBeInTheDocument()
    expect(screen.getByText('production')).toBeInTheDocument()
  })

  it('renders empty state with create button when no projects (FR-08)', () => {
    renderPage([paths.projects])
    expect(screen.getByText(/no projects/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /create project/i }).length).toBeGreaterThan(0)
  })

  it('calls archiveProject after confirmation (FR-10)', async () => {
    const archiveMock = jest.fn().mockResolvedValue(undefined) as any
    useProjectStore.setState({
      projects: [mockProjects[0]],
      archiveProject: archiveMock,
      fetchProjects: jest.fn() as any,
    })
    const confirmSpy = jest
      .spyOn(Modal, 'confirm')
      .mockImplementation((({ onOk }: { onOk?: () => void }) => {
        onOk?.()
        return { destroy: jest.fn(), update: jest.fn() } as any
      }) as any)

    renderPage([paths.projects])
    await waitFor(() => expect(screen.getByText('Project Alpha')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /archive/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(archiveMock).toHaveBeenCalledWith('p1')
    confirmSpy.mockRestore()
  })

  it('opens drawer with form fields when "Create project" is clicked (FR-05)', async () => {
    renderPage([paths.projects])
    fireEvent.click(screen.getAllByRole('button', { name: /create project/i })[0])
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toBeInTheDocument())
    expect(screen.getByLabelText(/application url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/environment/i)).toBeInTheDocument()
  })

  it('does not call archiveProject when cancelled (FR-10)', async () => {
    const archiveMock = jest.fn() as any
    useProjectStore.setState({
      projects: [mockProjects[0]],
      archiveProject: archiveMock,
      fetchProjects: jest.fn() as any,
    })
    const confirmSpy = jest
      .spyOn(Modal, 'confirm')
      .mockImplementation(
        (() => ({ destroy: jest.fn(), update: jest.fn() })) as any,
      )

    renderPage([paths.projects])
    await waitFor(() => expect(screen.getByText('Project Alpha')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /archive/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(archiveMock).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
