import { styled } from 'styled-components'
import { useAppStore } from '../../store/useAppStore'

/**
 * Stub landing page. Styled components live at module scope (not inside the
 * component body) so they are created once, not on every render.
 */
const Wrapper = styled.div`
  padding: 2rem;
  font-family: sans-serif;
`
export default function HomePage() {
  const ready = useAppStore((s) => s.ready)

  return (
    <Wrapper>
      <h1>Centry</h1>
      <p>Frontend scaffold ready: {String(ready)}</p>
    </Wrapper>
  )
}
