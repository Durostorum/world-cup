import type { Handler } from '@netlify/functions'
import { ensureUser } from './shared/users.js'

/** Netlify Identity event — ensures app DB row exists whenever a user logs in. */
export const handler: Handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || '{}') as {
      user?: { id?: string; email?: string; user_metadata?: { full_name?: string } }
    }
    const identityUser = payload.user
    if (!identityUser?.id || !identityUser.email) {
      return { statusCode: 400, body: 'Missing identity user' }
    }

    await ensureUser({
      id: identityUser.id,
      email: identityUser.email,
      displayName: identityUser.user_metadata?.full_name,
    })

    return { statusCode: 200, body: '' }
  } catch (err) {
    console.error('identity-login failed', err)
    return { statusCode: 500, body: 'Failed to provision app user' }
  }
}
