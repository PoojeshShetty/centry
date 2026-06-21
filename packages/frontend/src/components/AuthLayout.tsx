import type { ReactNode } from 'react'
import { styled } from 'styled-components'
import { theme } from '../theme'
import AuthRightPanel from './AuthRightPanel'

export interface AuthLayoutProps {
  children: ReactNode
  title: string
  tagline: string
}

const Viewport = styled.div`
  min-height: 100vh;
  display: flex;
`

const LeftPanel = styled.div`
  flex: 1;
  background: ${theme.auth.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;

  @media (max-width: 768px) {
    flex: unset;
    width: 100%;
  }
`

const RightPanelWrapper = styled.div`
  flex: 1;

  @media (max-width: 768px) {
    display: none;
  }
`

const FormBox = styled.div`
  width: 100%;
  max-width: 400px;
`

const Wordmark = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${theme.auth.accent};
  letter-spacing: -0.02em;
  margin-bottom: 2rem;
`

const FormTitle = styled.h1`
  color: ${theme.auth.text};
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
`

const Tagline = styled.p`
  color: ${theme.auth.textSecondary};
  font-size: 0.9375rem;
  margin: 0 0 2rem;
`

export function AuthLayout({ children, title, tagline }: AuthLayoutProps) {
  return (
    <Viewport>
      <LeftPanel>
        <FormBox>
          <Wordmark>centry</Wordmark>
          <FormTitle>{title}</FormTitle>
          <Tagline>{tagline}</Tagline>
          {children}
        </FormBox>
      </LeftPanel>
      <RightPanelWrapper data-testid="auth-right-panel-wrapper">
        <AuthRightPanel />
      </RightPanelWrapper>
    </Viewport>
  )
}

export default AuthLayout
