import { screen } from '@testing-library/react'
import { useAuthStore } from '../../../store/useAuthStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      token: 'jwt-123',
      user: {
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        created_at: '2026-01-01T00:00:00.000Z',
      },
      isAuthenticated: true,
    })
  })

  it('greets the signed-in user by name (FR-12)', () => {
    renderPage([paths.home])
    expect(screen.getByText('Hello Alice')).toBeInTheDocument()
  })
})
