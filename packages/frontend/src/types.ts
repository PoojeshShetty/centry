import type { AuthUser } from './store/useAuthStore'

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface LoginValues {
  email: string
  password: string
}

export interface RegisterValues {
  name: string
  email: string
  password: string
}
