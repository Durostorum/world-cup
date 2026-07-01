import { hydrateSession, refreshSession } from '@netlify/identity'
import GoTrue, { User } from 'gotrue-js'

const IDENTITY_PATH = '/.netlify/identity'

let sharedClient: GoTrue | null = null

function getSharedClient(): GoTrue | null {
  if (typeof window === 'undefined') return null
  if (!sharedClient) {
    sharedClient = new GoTrue({
      APIUrl: `${window.location.origin}${IDENTITY_PATH}`,
      setCookie: false,
    })
  }
  return sharedClient
}

function readBearerCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = /(?:^|; )nf_jwt=([^;]*)/.exec(document.cookie)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

function isLocalHttpDev() {
  return (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  )
}

/** Identity sets secure-only cookies; on local HTTP they may not persist — mirror the JWT for dev. */
export function setDevAuthCookie(token: string) {
  if (!isLocalHttpDev()) return
  document.cookie = `nf_jwt=${encodeURIComponent(token)}; path=/; samesite=lax`
}

async function jwtFromActiveSession(): Promise<string | null> {
  const client = getSharedClient()
  if (!client) return null

  let user = client.currentUser()
  if (!user) {
    user = User.recoverSession(client.api)
  }
  if (!user) return null

  try {
    return await user.jwt()
  } catch {
    try {
      return await user.jwt(true)
    } catch {
      return null
    }
  }
}

/** Keeps nf_jwt in sync for @netlify/identity getUser() during local HTTP dev. */
export async function syncDevAuthCookie(): Promise<void> {
  const jwt = await jwtFromActiveSession()
  if (jwt) setDevAuthCookie(jwt)
}

/** Resolves a Bearer token for API calls (cookie, GoTrue session, or refresh). */
export async function resolveAuthToken(): Promise<string | null> {
  const fromCookie = readBearerCookie()
  if (fromCookie) return fromCookie

  await hydrateSession().catch(() => null)

  const fromSession = await jwtFromActiveSession()
  if (fromSession) {
    setDevAuthCookie(fromSession)
    return fromSession
  }

  const refreshed = await refreshSession().catch(() => null)
  if (refreshed) {
    setDevAuthCookie(refreshed)
    return refreshed
  }

  const afterRefresh = readBearerCookie()
  if (afterRefresh) return afterRefresh

  const retry = await jwtFromActiveSession()
  if (retry) setDevAuthCookie(retry)
  return retry
}
