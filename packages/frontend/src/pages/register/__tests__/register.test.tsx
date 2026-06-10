import { jest } from '@jest/globals'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAuthStore } from '../../../store/useAuthStore'
import { renderPage } from '../../../utils/testUtils'
import { paths } from '../../../routes/routes'

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Register' }))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
    global.fetch = jest.fn()
  })

  it('on 201 calls setAuth and navigates to / (FR-09)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        token: 'jwt-123',
        user: {
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    })

    renderPage([paths.register])
    fillValidForm()

    await waitFor(() => expect(screen.getByText('Centry')).toBeInTheDocument())
    expect(useAuthStore.getState().token).toBe('jwt-123')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    const url = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(url).toBe('/api/auth/register')
  })

  it('on 409 renders "email already registered" inline and stays unauthenticated (FR-11)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'email already registered' }),
    })

    renderPage([paths.register])
    fillValidForm()

    await waitFor(() => expect(screen.getByText('email already registered')).toBeInTheDocument())
    expect(screen.queryByText('Centry')).not.toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
