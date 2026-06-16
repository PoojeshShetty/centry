import { Navigate, Link } from 'react-router-dom'
import { styled } from 'styled-components'
import { useAuthStore } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'
import { theme } from '../../theme'

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${theme.bg.app};
  color: ${theme.text.primary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: sans-serif;
`

const Hero = styled.section`
  text-align: center;
  max-width: 680px;
`

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${theme.text.primary};
`

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${theme.text.secondary};
  margin-bottom: 2.5rem;
  line-height: 1.6;
`

const CtaRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
`

const PrimaryLink = styled(Link)`
  padding: 0.75rem 2rem;
  background: ${theme.accent.primary};
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;

  &:hover {
    background: ${theme.accent.primaryHover};
    color: white;
  }
`

const SecondaryLink = styled(Link)`
  padding: 0.75rem 2rem;
  background: transparent;
  color: ${theme.text.primary};
  border: 1px solid ${theme.border.default};
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;

  &:hover {
    border-color: ${theme.accent.primary};
    color: ${theme.accent.primary};
  }
`

const Features = styled.section`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 900px;
`

const FeatureCard = styled.div`
  background: ${theme.bg.surface};
  border: 1px solid ${theme.border.subtle};
  border-radius: 8px;
  padding: 1.5rem;
  width: 260px;
`

const FeatureTitle = styled.h3`
  color: ${theme.text.primary};
  margin-bottom: 0.5rem;
  font-size: 1rem;
`

const FeatureDesc = styled.p`
  color: ${theme.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`

const FEATURES = [
  { title: 'Real-time log ingestion', desc: 'Ship logs from any Node.js or browser app over the Sentry envelope wire format.' },
  { title: 'Severity filtering', desc: 'Filter by trace, debug, info, warn, error, and fatal levels instantly.' },
  { title: 'Multi-project', desc: 'Manage multiple projects under one account with per-project DSNs.' },
]

export default function HomePage() {
  const token = useAuthStore((s) => s.token)

  if (token) {
    return <Navigate to={paths.projects} replace />
  }

  return (
    <Wrapper>
      <Hero>
        <HeroTitle>Centry</HeroTitle>
        <HeroSubtitle>
          A minimal, self-hosted logging platform. Capture, explore, and triage logs from your
          applications in real time.
        </HeroSubtitle>
        <CtaRow>
          <PrimaryLink to={paths.register}>Get started</PrimaryLink>
          <SecondaryLink to={paths.login}>Sign in</SecondaryLink>
        </CtaRow>
      </Hero>
      <Features>
        {FEATURES.map((f) => (
          <FeatureCard key={f.title}>
            <FeatureTitle>{f.title}</FeatureTitle>
            <FeatureDesc>{f.desc}</FeatureDesc>
          </FeatureCard>
        ))}
      </Features>
    </Wrapper>
  )
}
