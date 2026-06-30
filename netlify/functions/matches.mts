import type { Config } from '@netlify/functions'
import { matches, getBetHistory } from './shared/store.js'
import { error, handleOptions, json } from './shared/http.js'

export default async (req: Request) {
  const opt = handleOptions(req)
  if (opt) return opt

  if (req.method !== 'GET') return error('Method not allowed', 405)

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (id) {
    const match = matches.find((m) => m.id === id)
    if (!match) return error('Match not found', 404)
    return json({ match, betHistory: getBetHistory(id) })
  }

  return json({ matches })
}

export const config: Config = {
  path: '/matches',
}
