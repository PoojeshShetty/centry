import { type ReactNode } from 'react'
import HomePage from '../pages/home'
import LoginPage from '../pages/login'
import RegisterPage from '../pages/register'
import NotFoundPage from '../pages/not-found'

export interface RouteConfig {
  path: string
  element: ReactNode
}

/** Single source of truth for application path strings (used by app + tests). */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
} as const

/** Route table consumed by both the browser router and the test render helper. */
export const appRoutes: RouteConfig[] = [
  { path: paths.home, element: <HomePage /> },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },
  { path: '*', element: <NotFoundPage /> },
]
