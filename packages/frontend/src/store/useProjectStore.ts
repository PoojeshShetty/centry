import { create } from 'zustand'
import { projectApi } from '../utils/apiClient'

export interface Project {
  id: string
  name: string
  application_url: string
  description: string | null
  environment: string
  created_at: string
}

export interface ProjectWithDsn extends Project {
  dsn: string
}

export interface CreateProjectInput {
  name: string
  application_url: string
  description?: string
  environment: string
}

export interface UpdateProjectPatch {
  name?: string
  application_url?: string
  description?: string
  environment?: string
}

export interface ProjectState {
  projects: ProjectWithDsn[]
  selectedProject: ProjectWithDsn | null
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<void>
  updateProject: (id: string, patch: UpdateProjectPatch) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  rotateKey: (id: string) => Promise<void>
  selectProject: (project: ProjectWithDsn | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const projects = await projectApi.list()
      set({ projects, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  createProject: async (input) => {
    set({ error: null })
    try {
      const project = await projectApi.create(input)
      set((state) => ({ projects: [...state.projects, project] }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  updateProject: async (id, patch) => {
    set({ error: null })
    try {
      const updated = await projectApi.update(id, patch)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        selectedProject:
          state.selectedProject?.id === id ? updated : state.selectedProject,
      }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  archiveProject: async (id) => {
    set({ error: null })
    try {
      await projectApi.archive(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
      }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  rotateKey: async (id) => {
    set({ error: null })
    try {
      const { dsn } = await projectApi.rotateKey(id)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, dsn } : p)),
        selectedProject:
          state.selectedProject?.id === id
            ? { ...state.selectedProject, dsn }
            : state.selectedProject,
      }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  selectProject: (project) => {
    set({ selectedProject: project })
  },
}))
