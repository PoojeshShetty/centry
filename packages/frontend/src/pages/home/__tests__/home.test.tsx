import { render, screen } from '@testing-library/react'
import HomePage from '../index'

// Harness stub: confirms Jest can render a .tsx component (JSX transform,
// jsdom env, @testing-library/jest-dom matchers) from src/pages/home/.
describe('HomePage', () => {
  it('renders the scaffold heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: 'Centry' })).toBeInTheDocument()
  })
})
