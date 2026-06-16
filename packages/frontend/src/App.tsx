import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { useTokenExpiryCheck } from './hooks/useTokenExpiryCheck'

export default function App() {
  useTokenExpiryCheck()
  return <RouterProvider router={router} />
}
