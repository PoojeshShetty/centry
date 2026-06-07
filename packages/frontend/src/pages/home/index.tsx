import { styled } from 'styled-components'
import { useAppStore } from '../../store/useAppStore'

/**
 * Stub landing page.
 *
 * Demonstrates the project styling convention: styled components are defined
 * inline within the component function body (FR-14), never extracted to a
 * separate file or `styles/` directory (FR-23).
 */
export default function HomePage() {
  const Wrapper = styled.div`
    padding: 2rem;
    font-family: sans-serif;
  `

  const ready = useAppStore((s) => s.ready)

  return (
    <Wrapper>
      <h1>Centry</h1>
      <p>Frontend scaffold ready: {String(ready)}</p>
    </Wrapper>
  )
}
