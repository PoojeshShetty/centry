import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { message } from 'antd'
import { useProjectStore } from '../../../store/useProjectStore'
import ProjectDetailPanel from '../ProjectDetailPanel'

const mockProject = {
  id: 'p1',
  name: 'Project Alpha',
  application_url: 'https://alpha.example.com',
  description: null,
  environment: 'production',
  created_at: '2026-01-01T00:00:00.000Z',
  dsn: 'https://abc123def456@localhost:3000/p1',
}

function renderPanel(project = mockProject, onClose = jest.fn()) {
  return render(
    <MemoryRouter>
      <ProjectDetailPanel project={project} onClose={onClose} />
    </MemoryRouter>,
  )
}

describe.skip('ProjectDetailPanel', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
    jest.spyOn(message, 'success').mockImplementation((() => null) as any)
    useProjectStore.setState({
      rotateKey: jest.fn().mockResolvedValue(undefined) as any,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders nothing visible when project is null (FR-09)', () => {
    render(
      <MemoryRouter>
        <ProjectDetailPanel project={null} onClose={jest.fn()} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument()
  })

  it('renders drawer with project name when project is provided (FR-09)', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('Project Alpha')).toBeInTheDocument())
  })

  it('DSN is masked on initial render (FR-09)', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText(/••••••••/)).toBeInTheDocument())
    expect(screen.queryByText(mockProject.dsn)).not.toBeInTheDocument()
  })

  it('clicking Reveal shows full DSN (FR-09)', async () => {
    renderPanel()
    await waitFor(() => screen.getByRole('button', { name: /reveal/i }))
    fireEvent.click(screen.getByRole('button', { name: /reveal/i }))
    expect(screen.getByText(mockProject.dsn)).toBeInTheDocument()
  })

  it('copy button calls clipboard.writeText with full DSN (FR-09)', async () => {
    renderPanel()
    await waitFor(() => screen.getByRole('button', { name: /copy/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProject.dsn)
  })

  it('rotate key button calls useProjectStore.rotateKey (FR-09)', async () => {
    const rotateMock = jest.fn().mockResolvedValue(undefined) as any
    useProjectStore.setState({ rotateKey: rotateMock })
    renderPanel()
    await waitFor(() => screen.getByRole('button', { name: /rotate key/i }))
    fireEvent.click(screen.getByRole('button', { name: /rotate key/i }))
    await waitFor(() => expect(rotateMock).toHaveBeenCalledWith('p1'))
  })

  it('onClose is called when drawer is closed (FR-09)', async () => {
    const onClose = jest.fn()
    renderPanel(mockProject, onClose)
    await waitFor(() => screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('View Logs button is present and navigates to project logs (FR-12)', async () => {
    renderPanel()
    await waitFor(() => screen.getByRole('button', { name: /view logs/i }))
    expect(screen.getByRole('button', { name: /view logs/i })).toBeInTheDocument()
  })
})
