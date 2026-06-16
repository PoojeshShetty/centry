import { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { logger } from '@centry/sdk-react'
import { apiClient } from '../../utils/apiClient'
import { useAuthStore, type AuthUser } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'
import { theme } from '../../theme'

interface AuthResponse {
  token: string
  user: AuthUser
}

interface LoginValues {
  email: string
  password: string
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${theme.bg.app};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const Card = styled.div`
  background: ${theme.bg.surface};
  border: 1px solid ${theme.border.subtle};
  border-radius: 8px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
`

const Title = styled.h1`
  color: ${theme.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`

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
    <PageWrapper>
      <Card>
        <Title>Log in</Title>
        <Form layout="vertical" onFinish={onFinish}>
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
        </Form>
        <FooterText>
          Need an account? <Link to="/register">Register</Link>
        </FooterText>
      </Card>
    </PageWrapper>
  )
}
