import { jest } from '@jest/globals'
import type { Project, ProjectWithDsn } from '../useProjectStore'

const mockProjectApi = {
  list: jest.fn<() => Promise<Project[]>>(),
  create: jest.fn<() => Promise<ProjectWithDsn>>(),
  update: jest.fn<() => Promise<ProjectWithDsn>>(),
  archive: jest.fn<() => Promise<void>>(),
  rotateKey: jest.fn<() => Promise<{ dsn: string }>>(),
}

jest.unstable_mockModule('../../utils/apiClient', () => ({
  projectApi: mockProjectApi,
  apiClient: { request: jest.fn() },
}))

const { useProjectStore } = await import('../useProjectStore')

const mockProject: ProjectWithDsn = {
  id: 'proj-1',
  name: 'Test Project',
  application_url: 'https://example.com',
  description: null,
  environment: 'production',
  created_at: '2026-01-01T00:00:00.000Z',
  dsn: ""
}

const mockProjectWithDsn: ProjectWithDsn = {
  ...mockProject,
  dsn: 'https://abc123@localhost:3000/proj-1',
}

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      selectedProject: null,
      isLoading: false,
      error: null,
    })
    jest.clearAllMocks()
  })

  describe('fetchProjects (FR-08)', () => {
    it('updates projects array when API resolves', async () => {
      mockProjectApi.list.mockResolvedValue([mockProject])

      await useProjectStore.getState().fetchProjects()

      expect(useProjectStore.getState().projects).toEqual([mockProject])
      expect(useProjectStore.getState().isLoading).toBe(false)
      expect(useProjectStore.getState().error).toBeNull()
    })

    it('sets isLoading to true during fetch', async () => {
      let resolveList!: (value: Project[]) => void
      mockProjectApi.list.mockReturnValue(
        new Promise<Project[]>((res) => {
          resolveList = res
        }),
      )

      const fetchPromise = useProjectStore.getState().fetchProjects()
      expect(useProjectStore.getState().isLoading).toBe(true)

      resolveList([mockProject])
      await fetchPromise
      expect(useProjectStore.getState().isLoading).toBe(false)
    })

    it('sets error on API failure', async () => {
      mockProjectApi.list.mockRejectedValue(new Error('network error'))

      await useProjectStore.getState().fetchProjects()

      expect(useProjectStore.getState().error).toBe('network error')
      expect(useProjectStore.getState().isLoading).toBe(false)
    })
  })

  describe('createProject', () => {
    it('adds new project to projects array', async () => {
      mockProjectApi.create.mockResolvedValue(mockProjectWithDsn)

      await useProjectStore.getState().createProject({
        name: 'Test Project',
        application_url: 'https://example.com',
        environment: 'production',
      })

      const { projects } = useProjectStore.getState()
      expect(projects).toHaveLength(1)
      expect(projects[0].id).toBe('proj-1')
    })
  })

  describe('archiveProject (FR-10)', () => {
    it('removes the archived project from the projects array', async () => {
      useProjectStore.setState({ projects: [mockProject] })
      mockProjectApi.archive.mockResolvedValue(undefined)

      await useProjectStore.getState().archiveProject('proj-1')

      expect(useProjectStore.getState().projects).toHaveLength(0)
    })

    it('clears selectedProject when the archived project was selected', async () => {
      useProjectStore.setState({ projects: [mockProject], selectedProject: mockProjectWithDsn })
      mockProjectApi.archive.mockResolvedValue(undefined)

      await useProjectStore.getState().archiveProject('proj-1')

      expect(useProjectStore.getState().selectedProject).toBeNull()
    })

    it('sets error on API failure and keeps project in array', async () => {
      useProjectStore.setState({ projects: [mockProject] })
      mockProjectApi.archive.mockRejectedValue(new Error('forbidden'))

      await useProjectStore.getState().archiveProject('proj-1')

      expect(useProjectStore.getState().projects).toHaveLength(1)
      expect(useProjectStore.getState().error).toBe('forbidden')
    })
  })

  describe('rotateKey (FR-09)', () => {
    it('updates selectedProject.dsn when rotation succeeds', async () => {
      useProjectStore.setState({ selectedProject: mockProjectWithDsn })
      mockProjectApi.rotateKey.mockResolvedValue({ dsn: 'https://newkey@localhost:3000/proj-1' })

      await useProjectStore.getState().rotateKey('proj-1')

      expect(useProjectStore.getState().selectedProject?.dsn).toBe(
        'https://newkey@localhost:3000/proj-1',
      )
    })

    it('updates projects array dsn when rotation succeeds (FR-06)', async () => {
      useProjectStore.setState({ projects: [mockProjectWithDsn], selectedProject: null })
      mockProjectApi.rotateKey.mockResolvedValue({ dsn: 'https://newkey@localhost:3000/proj-1' })

      await useProjectStore.getState().rotateKey('proj-1')

      expect(useProjectStore.getState().projects[0].dsn).toBe(
        'https://newkey@localhost:3000/proj-1',
      )
    })

    it('sets error on API failure', async () => {
      useProjectStore.setState({ selectedProject: mockProjectWithDsn })
      mockProjectApi.rotateKey.mockRejectedValue(new Error('unauthorized'))

      await useProjectStore.getState().rotateKey('proj-1')

      expect(useProjectStore.getState().error).toBe('unauthorized')
    })
  })

  describe('selectProject', () => {
    it('sets selectedProject to the given project', () => {
      useProjectStore.getState().selectProject(mockProjectWithDsn)
      expect(useProjectStore.getState().selectedProject).toEqual(mockProjectWithDsn)
    })

    it('clears selectedProject when called with null', () => {
      useProjectStore.setState({ selectedProject: mockProjectWithDsn })
      useProjectStore.getState().selectProject(null)
      expect(useProjectStore.getState().selectedProject).toBeNull()
    })
  })

  describe('updateProject', () => {
    it('replaces the updated project in the projects array', async () => {
      useProjectStore.setState({ projects: [mockProject] })
      const updated = { ...mockProjectWithDsn, name: 'Updated Name' }
      mockProjectApi.update.mockResolvedValue(updated)

      await useProjectStore.getState().updateProject('proj-1', { name: 'Updated Name' })

      const { projects } = useProjectStore.getState()
      expect(projects[0].name).toBe('Updated Name')
    })
  })
})
