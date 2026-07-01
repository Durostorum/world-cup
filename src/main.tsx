import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { runEarlyAuthCallback } from './lib/auth-callback'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

async function boot() {
  const earlyAuth = await runEarlyAuthCallback()

  createRoot(rootEl as HTMLElement).render(
    <StrictMode>
      <App earlyAuth={earlyAuth.status === 'none' ? undefined : earlyAuth} />
    </StrictMode>,
  )
}

void boot()
