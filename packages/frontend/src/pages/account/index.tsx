import { useEffect, useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { logger } from '@centry/sdk-react'
import { apiClient } from '../../utils/apiClient'
import { useAuthStore, type AuthUser } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'

/**
 * Account-information view (FR-13). Loads the signed-in account from
 * `GET /api/auth/me` on mount and shows name / email / member-since. The logout
 * control clears the session (FR-14) and returns to the login page.
 */
export default function AccountPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [account, setAccount] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    apiClient
      .request<AuthUser>('/api/auth/me')
      .then((data) => {
        if (active) setAccount(data)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'failed to load account'
        if (active) setError(message)
        logger.error('Failed to load account: {0}', [message])
      })
    return () => {
      active = false
    }
  }, [])

  function onLogout() {
    logout()
    navigate(paths.login)
  }

  return (
    <div style={{ maxWidth: 360, margin: '2rem auto' }}>
      <h1>Account</h1>
      {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
      {!account && !error && <Spin />}
      {account && (
        <dl>
          <dt>Name</dt>
          <dd>{account.name}</dd>
          <dt>Email</dt>
          <dd>{account.email}</dd>
          <dt>Member since</dt>
          <dd>{new Date(account.created_at).toLocaleDateString()}</dd>
        </dl>
      )}
      <Button onClick={onLogout}>Log out</Button>
    </div>
  )
}
