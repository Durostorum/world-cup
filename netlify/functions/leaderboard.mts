import type { Config } from '@netlify/functions'

import { error, json, optionalAuth, withApiHandler } from './shared/http.js'

import { getLeaderboard } from './shared/queries.js'

import { ensureUser } from './shared/users.js'



export default withApiHandler(async (req: Request) => {

  if (req.method !== 'GET') return error(req, 'Method not allowed', 405)



  const auth = await optionalAuth(req)

  if (auth) {

    await ensureUser({ id: auth.id, email: auth.email })

  }



  const entries = await getLeaderboard(auth?.id ?? '')

  return json(req, { entries })

})



export const config: Config = {

  path: '/api/leaderboard',

}

