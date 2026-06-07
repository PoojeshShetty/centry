import { create } from 'zustand'

/**
 * Application-wide UI state.
 *
 * Scaffold placeholder slice — feature state (logs, filters, live tail) is
 * added in M3. `theme` is a placeholder; theming is deferred to M3.
 */
export interface AppState {
  ready: boolean
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: true,
  theme: 'light',
  setTheme: (t) => set({ theme: t }),
}))
