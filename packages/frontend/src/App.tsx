import { RouterProvider } from 'react-router-dom'
import router from './routes'

/**
 * Top-level application component. Wires the router into the React tree.
 */
export default function App() {
  return <RouterProvider router={router} />
}
