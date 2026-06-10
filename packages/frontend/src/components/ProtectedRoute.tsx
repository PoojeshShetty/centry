import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { paths } from '../routes/routes'

/**
 * Gate for authenticated routes (FR-15). Renders its children when the auth
 * store reports a session; otherwise redirects to the login page (`replace` so
 * the protected URL does not stay in history and the back button can't restore it).
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />
  }

  return <>{children}</>
}
