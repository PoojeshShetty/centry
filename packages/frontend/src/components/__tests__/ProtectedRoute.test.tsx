import { screen } from '@testing-library/react'
import { useAuthStore } from '../../store/useAuthStore'
import { renderPage } from '../../utils/testUtils'
import ProtectedRoute from '../ProtectedRoute'
import type { RouteObject } from 'react-router-dom'

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    ),
  },
  { path: '/login', element: <div>Login Screen</div> },
]

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
  })

  it('redirects to /login when unauthenticated (FR-15)', () => {
    useAuthStore.setState({ isAuthenticated: false })

    renderPage(['/'], routes)

    expect(screen.getByText('Login Screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders the protected child when authenticated (FR-15)', () => {
    useAuthStore.setState({ isAuthenticated: true })

    renderPage(['/'], routes)

    expect(screen.getByText('Secret')).toBeInTheDocument()
    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument()
  })
})
