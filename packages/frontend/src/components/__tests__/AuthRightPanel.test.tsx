import { render, screen } from '@testing-library/react'
import { AuthRightPanel } from '../AuthRightPanel'

describe('AuthRightPanel', () => {
  it('renders the headline', () => {
    render(<AuthRightPanel />)
    expect(screen.getByText(/Log everything/)).toBeInTheDocument()
  })

  it('renders log-level badges for each entry', () => {
    render(<AuthRightPanel />)
    expect(screen.getAllByText(/info|warn|error|debug|fatal|trace/i).length).toBeGreaterThanOrEqual(5)
  })

  it('renders log message text', () => {
    render(<AuthRightPanel />)
    expect(screen.getByText(/Server started on port/i)).toBeInTheDocument()
  })
})
