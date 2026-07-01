import type { Config } from '@netlify/functions'
import { runSeed } from './shared/seed-data.js'
import { error, json, requireAdmin, withApiHandler } from './shared/http.js'

export default withApiHandler(async (req: Request) => {
  if (req.method !== 'POST') return error(req, 'Method not allowed', 405)

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const fixtures = await runSeed()
  console.log('admin-seed:', { admin: auth.email, fixtures })
  return json(req, { ok: true, fixtures })
})

export const config: Config = {
  path: '/api/admin/seed',
}
