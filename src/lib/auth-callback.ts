import { AuthError, handleAuthCallback, hydrateSession } from '@netlify/identity'

let earlyCallbackDone = false

export type EarlyAuthResult =
  | { status: 'none' }
  | { status: 'confirmed'; notice: string }
  | { status: 'error'; notice: string }

/**
 * Runs once before React mounts so email confirmation is not broken by
 * StrictMode double effects or lost in a race with AuthProvider bootstrap.
 */
export async function runEarlyAuthCallback(): Promise<EarlyAuthResult> {
  if (earlyCallbackDone || typeof window === 'undefined') return { status: 'none' }
  const hash = window.location.hash
  if (!hash || !hash.includes('token')) return { status: 'none' }

  earlyCallbackDone = true
  try {
    const result = await handleAuthCallback()
    await hydrateSession()

    if (result?.type === 'confirmation' && result.user) {
      return { status: 'confirmed', notice: 'Email confirmed — you are signed in.' }
    }
    return { status: 'none' }
  } catch (err) {
    earlyCallbackDone = false
    const message =
      err instanceof AuthError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Email verification failed.'
    return { status: 'error', notice: message }
  }
}
