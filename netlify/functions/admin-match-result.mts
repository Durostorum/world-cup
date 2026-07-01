import type { Config, Context } from '@netlify/functions'
import { z } from 'zod'
import { BettingError, recordMatchResult } from './shared/betting.js'
import { error, json, parseBody, requireAdmin, withApiHandler } from './shared/http.js'

const resultSchema = z.object({
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
  winnerTeamId: z.string().uuid().optional(),
})

export default withApiHandler(async (req: Request, context: Context) => {
  if (req.method !== 'POST') return error(req, 'Method not allowed', 405)

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const matchId = context.params?.id
  if (!matchId) return error(req, 'Match id required', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error(req, 'Invalid JSON body', 400)
  }

  const parsed = parseBody(resultSchema, body)
  if (!parsed.ok) return error(req, parsed.error, 400)

  try {
    const result = await recordMatchResult({ matchId, ...parsed.data })
    console.log('admin match result', { admin: auth.email, matchId, ...result })
    return json(req, { ok: true, ...result })
  } catch (e) {
    if (e instanceof BettingError) return error(req, e.message, e.status)
    throw e
  }
})

export const config: Config = {
  path: '/api/admin/matches/:id/result',
}
