import { type ReactNode } from 'react'
import HomePage from '../pages/home'
import LoginPage from '../pages/login'
import RegisterPage from '../pages/register'
import AccountPage from '../pages/account'
import ProjectsPage from '../pages/projects'
import LogsPage from '../pages/logs'
import NotFoundPage from '../pages/not-found'
import ProtectedRoute from '../components/ProtectedRoute'

export interface RouteConfig {
  path: string
  element: ReactNode
}

/** Single source of truth for application path strings (used by app + tests). */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  account: '/account',
  projects: '/projects',
  projectLogs: '/projects/:projectId/logs',
} as const

/** Route table consumed by both the browser router and the test render helper. */
export const appRoutes: RouteConfig[] = [
  {
    path: paths.home,
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: paths.account,
    element: (
      <ProtectedRoute>
        <AccountPage />
      </ProtectedRoute>
    ),
  },
  {
    path: paths.projects,
    element: (
      <ProtectedRoute>
        <ProjectsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: paths.projectLogs,
    element: (
      <ProtectedRoute>
        <LogsPage />
      </ProtectedRoute>
    ),
  },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },
  { path: '*', element: <NotFoundPage /> },
]
