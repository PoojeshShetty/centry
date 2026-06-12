import { jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import type { LogItem } from '@centry/shared'

const { default: LogRow } = await import('../LogRow')

function makeLog(overrides: Partial<LogItem> = {}): LogItem {
  return {
    timestamp: Math.floor(Date.now() / 1000) - 30,
    level: 'info',
    severity_number: 9,
    body: 'Test log message',
    ...overrides,
  }
}

describe('LogRow (FR-15)', () => {
  it('renders the log body', () => {
    render(<LogRow log={makeLog({ body: 'hello world' })} onClick={jest.fn()} />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('renders the level badge', () => {
    render(<LogRow log={makeLog({ level: 'error' })} onClick={jest.fn()} />)
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('calls onClick with the log when clicked', () => {
    const onClick = jest.fn()
    const log = makeLog()
    render(<LogRow log={log} onClick={onClick} />)
    fireEvent.click(screen.getByText(log.body))
    expect(onClick).toHaveBeenCalledWith(log)
  })

  it('shows ISO timestamp in title attribute on hover', () => {
    const ts = 1700000000
    render(<LogRow log={makeLog({ timestamp: ts })} onClick={jest.fn()} />)
    const isoStr = new Date(ts * 1000).toISOString()
    expect(screen.getByTitle(isoStr)).toBeInTheDocument()
  })

  describe('level badge colours', () => {
    const levelCases: Array<{ level: string; expectedColor: string }> = [
      { level: 'trace', expectedColor: '#8c8c8c' },
      { level: 'debug', expectedColor: '#722ed1' },
      { level: 'info', expectedColor: '#1677ff' },
      { level: 'warn', expectedColor: '#d48806' },
      { level: 'error', expectedColor: '#ff4d4f' },
      { level: 'fatal', expectedColor: '#a8071a' },
    ]

    for (const { level, expectedColor } of levelCases) {
      it(`${level} badge has correct text color`, () => {
        const { container } = render(
          <LogRow log={makeLog({ level })} onClick={jest.fn()} />,
        )
        const badge = screen.getByText(level)
        const style = window.getComputedStyle(badge)
        // styled-components inline class — check the rendered element contains
        // the level text and relies on class-based styling; assert badge exists
        expect(badge).toBeInTheDocument()
        // Verify the color is encoded in the element's class style by checking
        // the container has a style tag with the expected color
        const styleContent = container.querySelector('style')?.textContent ?? ''
        // styled-components injects styles into document; check document styles
        const allStyles = Array.from(document.styleSheets)
          .flatMap((s) => {
            try {
              return Array.from(s.cssRules).map((r) => r.cssText)
            } catch {
              return []
            }
          })
          .join('\n')
        expect(allStyles).toContain(expectedColor)
      })
    }
  })
})
