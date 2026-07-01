import type { Config, Context } from '@netlify/functions'
import { lockMatchdayBets } from './shared/betting.js'
import { error, json, requireAdmin, withApiHandler } from './shared/http.js'

export default withApiHandler(async (req: Request, context: Context) => {
  if (req.method !== 'POST') return error(req, 'Method not allowed', 405)

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const date = context.params?.date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return error(req, 'Invalid matchday date', 400)
  }

  const locked = await lockMatchdayBets(date)
  console.log('admin lock matchday', { admin: auth.email, date, locked })
  return json(req, { ok: true, matchdayDate: date, betsLocked: locked })
})

export const config: Config = {
  path: '/api/admin/matchdays/:date/lock',
}
