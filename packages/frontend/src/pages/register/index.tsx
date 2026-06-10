import { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { useAuthStore, type AuthUser } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'

interface AuthResponse {
  token: string
  user: AuthUser
}

interface RegisterValues {
  name: string
  email: string
  password: string
}

/**
 * Registration page (FR-09/FR-11). On a 201 it authenticates and navigates home;
 * a 409 (duplicate email) or 400 (validation) message is shown inline.
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onFinish(values: RegisterValues) {
    setError(null)
    setSubmitting(true)
    try {
      const data = await apiClient.request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setAuth(data.token, data.user)
      navigate(paths.home)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 360, margin: '2rem auto' }}>
      <h1>Register</h1>
      {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'name is required' }]}
      >
        <Input />
      </Form.Item>
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
        rules={[{ required: true, min: 8, message: 'password must be at least 8 characters' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          Register
        </Button>
      </Form.Item>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </Form>
  )
}
