import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render } from '@testing-library/react'
import AppShell from '../AppShell'

function renderAppShell(path: string, pageContent: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/projects', element: <div>{pageContent}</div> },
          { path: '/account', element: <div>{pageContent}</div> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

describe('AppShell', () => {
  it('renders Projects and Account navigation items', () => {
    renderAppShell('/projects', 'Projects content')
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('renders the outlet content', () => {
    renderAppShell('/projects', 'Projects content')
    expect(screen.getByText('Projects content')).toBeInTheDocument()
  })
})
