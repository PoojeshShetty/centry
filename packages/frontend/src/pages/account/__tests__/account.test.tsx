import { jest } from '@jest/globals'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../../store/useAuthStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

const account = {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('AccountPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: 'jwt-123', user: account, isAuthenticated: true })
    global.fetch = jest.fn()
  })

  it('fetches /api/auth/me and renders name, email, and member-since (FR-13)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => account,
    })

    renderPage([paths.account])

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(
      screen.getByText(new Date(account.created_at).toLocaleDateString()),
    ).toBeInTheDocument()

    const url = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(url).toBe('/api/auth/me')
    // No password information is ever shown.
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
  })

  it('logs out and navigates to /login when the logout control is used (FR-14)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => account,
    })

    renderPage([paths.account])

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument(),
    )
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})
