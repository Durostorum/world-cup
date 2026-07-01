import type { Config } from '@netlify/functions'
import { runSeed } from './shared/seed-data.js'
import { error, json, withApiHandler } from './shared/http.js'

/** Local-only: seeds fixtures via the same DB connection Netlify Functions use. */
export default withApiHandler(async (req: Request) => {
  if (process.env.CONTEXT === 'production') {
    return error(req, 'Not found', 404)
  }
  if (req.method !== 'POST') return error(req, 'Method not allowed', 405)

  const fixtures = await runSeed()
  console.log('dev-seed: synced', fixtures, 'fixtures')
  return json(req, { ok: true, fixtures })
})

export const config: Config = {
  path: '/api/dev/seed',
}
