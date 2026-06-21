import { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { apiClient } from '../../utils/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'
import { theme } from '../../theme'
import AuthLayout from '../../components/AuthLayout'
import type { AuthResponse, RegisterValues } from '../../types'

const FooterText = styled.p`
  color: ${theme.text.secondary};
  margin-top: 0.5rem;
  text-align: center;

  a {
    color: ${theme.accent.primary};
    &:hover {
      color: ${theme.accent.primaryHover};
    }
  }
`

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
    <AuthLayout title="Create an account" tagline="Start capturing logs in minutes.">
      <Form layout="vertical" onFinish={onFinish}>
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
      </Form>
      <FooterText>
        Already have an account? <Link to="/login">Log in</Link>
      </FooterText>
    </AuthLayout>
  )
}
