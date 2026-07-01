import type { Config } from '@netlify/functions'

import { error, json, requireAuth, withApiHandler } from './shared/http.js'

import { ensureUser, maskEmail } from './shared/users.js'



export default withApiHandler(async (req: Request) => {

  if (req.method !== 'GET') return error(req, 'Method not allowed', 405)



  const auth = await requireAuth(req)

  if (auth instanceof Response) return auth



  const user = await ensureUser({ id: auth.id, email: auth.email })



  return json(req, {

    user: {

      id: user.id,

      email: maskEmail(user.email),

      displayName: user.displayName,

      coinBalance: user.coinBalance,

      totalPredictions: user.totalPredictions,

      correctPredictions: user.correctPredictions,

    },

  })

})



export const config: Config = {

  path: '/api/profile',

}

