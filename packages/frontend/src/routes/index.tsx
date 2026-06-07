import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../pages/home'
import NotFoundPage from '../pages/not-found'

/**
 * Root router definition (React Router data-router API).
 *
 * Scaffold stub: `/` → HomePage, everything else → NotFoundPage. M3 feature
 * routes (logs explorer) are added here.
 */
const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
])

export default router
