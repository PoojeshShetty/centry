import { render } from '@testing-library/react'
import { AuthRightPanel } from '../AuthRightPanel'

describe('AuthRightPanel', () => {
  it('renders exactly three skeleton cards', () => {
    const { container } = render(<AuthRightPanel />)
    const skeletons = container.querySelectorAll('.ant-skeleton')
    expect(skeletons).toHaveLength(3)
  })

  it('all skeleton cards have the active prop (shimmer animation)', () => {
    const { container } = render(<AuthRightPanel />)
    const activeSkeletons = container.querySelectorAll('.ant-skeleton-active')
    expect(activeSkeletons).toHaveLength(3)
  })
})
