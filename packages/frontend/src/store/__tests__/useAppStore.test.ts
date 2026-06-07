import { useAppStore } from '../useAppStore'

// Harness stub: confirms Jest resolves the Zustand store from src/store/ and
// that its typed state slice + action behave as declared.
describe('useAppStore', () => {
  it('exposes the initial state slice', () => {
    const state = useAppStore.getState()
    expect(state.ready).toBe(true)
    expect(state.theme).toBe('light')
  })

  it('updates theme via setTheme', () => {
    useAppStore.getState().setTheme('dark')
    expect(useAppStore.getState().theme).toBe('dark')
    // restore for isolation
    useAppStore.getState().setTheme('light')
  })
})
