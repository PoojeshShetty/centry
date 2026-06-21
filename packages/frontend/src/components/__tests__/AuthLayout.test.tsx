import { render, screen } from '@testing-library/react'
import { AuthLayout } from '../AuthLayout'

const defaultProps = {
  title: 'Log in',
  tagline: 'Welcome back to centry',
  children: <div>Form content</div>,
}

describe('AuthLayout', () => {
  it('renders children in the left panel (FR-01)', () => {
    render(<AuthLayout {...defaultProps} />)
    expect(screen.getByText('Form content')).toBeInTheDocument()
  })

  it('renders the title prop (FR-05)', () => {
    render(<AuthLayout {...defaultProps} />)
    expect(screen.getByText('Log in')).toBeInTheDocument()
  })

  it('renders the tagline prop (FR-05)', () => {
    render(<AuthLayout {...defaultProps} />)
    expect(screen.getByText('Welcome back to centry')).toBeInTheDocument()
  })

  it('renders the centry wordmark (FR-05)', () => {
    render(<AuthLayout {...defaultProps} />)
    expect(screen.getByText('centry')).toBeInTheDocument()
  })

  // CSS media query hiding (@media max-width: 768px) is not computable in jsdom.
  // This test verifies the right-panel element exists in the DOM; visual hiding is CSS-only.
  it('includes the right panel wrapper in the DOM (FR-08, hidden by CSS at ≤768px)', () => {
    const { container } = render(<AuthLayout {...defaultProps} />)
    expect(container.querySelector('[data-testid="auth-right-panel-wrapper"]')).toBeInTheDocument()
  })
})
