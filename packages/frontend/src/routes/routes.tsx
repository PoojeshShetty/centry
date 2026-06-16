import type { RouteObject } from 'react-router-dom'
import HomePage from '../pages/home'
import LoginPage from '../pages/login'
import RegisterPage from '../pages/register'
import AccountPage from '../pages/account'
import ProjectsPage from '../pages/projects'
import LogsPage from '../pages/logs'
import NotFoundPage from '../pages/not-found'
import ProtectedRoute from '../components/ProtectedRoute'
import AppShell from '../components/AppShell'

export type RouteConfig = RouteObject

/** Single source of truth for application path strings (used by app + tests). */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  account: '/account',
  projects: '/projects',
  projectLogs: '/projects/:projectId/logs',
} as const

/** Route table consumed by the browser router. */
export const appRoutes: RouteObject[] = [
  { path: paths.home, element: <HomePage /> },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: paths.projects, element: <ProjectsPage /> },
      { path: paths.projectLogs, element: <LogsPage /> },
      { path: paths.account, element: <AccountPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
