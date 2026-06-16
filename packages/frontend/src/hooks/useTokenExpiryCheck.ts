import { useEffect } from 'react'
import router from '../routes'
import { isTokenExpired, useAuthStore } from '../store/useAuthStore'

const CHECK_INTERVAL_MS = 60_000

export function useTokenExpiryCheck(): void {
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    if (!token) return

    const id = setInterval(() => {
      if (isTokenExpired(token)) {
        logout()
        void router.navigate('/login')
      }
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [token, logout])
}
