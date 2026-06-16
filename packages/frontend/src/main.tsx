import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@centry/sdk-react'
import App from './App'
import './App.css'

if (import.meta.env.VITE_CENTRY_DSN) {
  init({ dsn: import.meta.env.VITE_CENTRY_DSN })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
