import type { Config } from '@netlify/functions'
import { getLeaderboard } from './shared/store.js'
import { error, getUserId, handleOptions, json } from './shared/http.js'

export default async (req: Request) {
  const opt = handleOptions(req)
  if (opt) return opt

  if (req.method !== 'GET') return error('Method not allowed', 405)

  const userId = getUserId(req)
  return json({ entries: getLeaderboard(userId) })
}

export const config: Config = {
  path: '/leaderboard',
}
