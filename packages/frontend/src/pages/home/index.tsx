import { styled } from 'styled-components'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { paths } from '../../routes/routes'

/**
 * Protected landing page (FR-12). Greets the signed-in user by name. Styled
 * components live at module scope (not inside the component body) so they are
 * created once, not on every render.
 */
const Wrapper = styled.div`
  padding: 2rem;
  font-family: sans-serif;
`
export default function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <Wrapper>
      <h1>Centry</h1>
      <h2>{`Hello ${user?.name ?? ''}`}</h2>
      <p>
        <Link to={paths.account}>Account</Link>
      </p>
    </Wrapper>
  )
}
