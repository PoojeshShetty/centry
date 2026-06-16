import { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { logger } from '@centry/sdk-react'
import { apiClient } from '../../utils/apiClient'
import { useAuthStore, type AuthUser } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'

interface AuthResponse {
  token: string
  user: AuthUser
}

interface LoginValues {
  email: string
  password: string
}

/**
 * Login page (FR-10/FR-11). On a 200 it persists the JWT and navigates home;
 * a 401 shows the generic "invalid email or password" message inline.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onFinish(values: LoginValues) {
    setError(null)
    setSubmitting(true)
    try {
      const data = await apiClient.request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setAuth(data.token, data.user)
      navigate(paths.home)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'login failed'
      setError(message)
      logger.error('Login failed: {0}', [message], { 'user.email': values.email })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 360, margin: '2rem auto' }}>
      <h1>Log in</h1>
      {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
      <Form.Item
        label="Email"
        name="email"
        rules={[{ required: true, type: 'email', message: 'a valid email is required' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: 'password is required' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          Log in
        </Button>
      </Form.Item>
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </Form>
  )
}
