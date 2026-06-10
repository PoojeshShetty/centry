import { createBrowserRouter } from 'react-router-dom'
import { appRoutes } from './routes'

/**
 * Root router definition (React Router data-router API). Routes are defined once
 * in `./routes` so the app and the test render helper stay in sync.
 */
const router = createBrowserRouter(appRoutes)

export default router
