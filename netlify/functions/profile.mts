import type { Config } from '@netlify/functions'
import { users } from './shared/store.js'
import { error, getUserId, handleOptions, json } from './shared/http.js'

export default async (req: Request) {
  const opt = handleOptions(req)
  if (opt) return opt

  if (req.method !== 'GET') return error('Method not allowed', 405)

  const userId = getUserId(req)
  const user = users.find((u) => u.id === userId)
  if (!user) return error('User not found', 404)

  const { email, ...safe } = user
  return json({
    user: {
      ...safe,
      email: email.replace(/(.{2}).+(@.*)/, '$1***$2'),
    },
  })
}

export const config: Config = {
  path: '/profile',
}
