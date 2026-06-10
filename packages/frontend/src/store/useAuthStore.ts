import { create } from 'zustand'

/** Public account shape returned by the auth endpoints (never includes the hash). */
export interface AuthUser {
  id: string
  name: string
  email: string
  created_at: string
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

const TOKEN_KEY = 'centry.auth.token'
const USER_KEY = 'centry.auth.user'

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const initialToken = loadToken()
const initialUser = loadUser()

/**
 * Authentication state. The JWT + user are persisted to `localStorage` so a
 * page refresh keeps the session (FR-10/FR-15); `logout` clears them (FR-14).
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: Boolean(initialToken),
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
