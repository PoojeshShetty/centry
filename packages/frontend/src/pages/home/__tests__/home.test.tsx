import { screen } from '@testing-library/react'
import { useAuthStore } from '../../../store/useAuthStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
  })

  describe('unauthenticated visitor (FR-04)', () => {
    it('renders hero section', () => {
      renderPage([paths.home])
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('renders CTA button linking to /register', () => {
      renderPage([paths.home])
      const link = screen.getByRole('link', { name: /get started/i })
      expect(link).toHaveAttribute('href', paths.register)
    })

    it('renders CTA button linking to /login', () => {
      renderPage([paths.home])
      const link = screen.getByRole('link', { name: /sign in/i })
      expect(link).toHaveAttribute('href', paths.login)
    })
  })

  describe('authenticated redirect (FR-04 / FR-07)', () => {
    it('redirects to /projects when token is present', () => {
      useAuthStore.setState({
        token: 'jwt-123',
        user: { id: '1', name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01T00:00:00.000Z' },
        isAuthenticated: true,
      })
      renderPage([paths.home])
      expect(screen.queryByRole('heading', { level: 1, name: /centry/i })).not.toBeInTheDocument()
    })
  })
})
