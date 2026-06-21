import { jest } from '@jest/globals'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../../store/useAuthStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

async function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
    global.fetch = jest.fn()
  })

  it('on 200 persists the JWT via setAuth and navigates to /projects (FR-10)', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'jwt-456',
          user: {
            id: '1',
            name: 'Alice',
            email: 'alice@example.com',
            created_at: '2026-01-01T00:00:00.000Z',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

    renderPage([paths.login])
    fillValidForm()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument())
    expect(useAuthStore.getState().token).toBe('jwt-456')
    expect(localStorage.getItem('centry.auth.token')).toBe('jwt-456')

    const url = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(url).toBe('/api/auth/login')
  })

  it('on 401 renders "invalid email or password" inline (FR-11)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid email or password' }),
    })

    renderPage([paths.login])
    await fillValidForm()

    await waitFor(() =>
      expect(screen.getByText('invalid email or password')).toBeInTheDocument(),
    )
    expect(screen.queryByText('Centry')).not.toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
