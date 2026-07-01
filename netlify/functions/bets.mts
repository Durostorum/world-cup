import type { Config } from '@netlify/functions'

import { z } from 'zod'

import { BettingError, listUserBets, placeBet } from './shared/betting.js'

import { error, json, parseBody, requireAuth, withApiHandler } from './shared/http.js'

import { ensureUser } from './shared/users.js'



const betSchema = z.object({

  matchId: z.string().uuid(),

  pickedTeamId: z.string().uuid(),

  stake: z.number().int().positive().max(1_000_000),

})



export default withApiHandler(async (req: Request) => {

  const auth = await requireAuth(req)

  if (auth instanceof Response) return auth



  const user = await ensureUser({

    id: auth.id,

    email: auth.email,

  })



  if (req.method === 'GET') {

    const bets = await listUserBets(user.id)

    return json(req, { bets })

  }



  if (req.method !== 'POST') return error(req, 'Method not allowed', 405)



  let body: unknown

  try {

    body = await req.json()

  } catch {

    return error(req, 'Invalid JSON body', 400)

  }



  const parsed = parseBody(betSchema, body)

  if (!parsed.ok) return error(req, parsed.error, 400)



  try {

    const result = await placeBet({

      userId: user.id,

      ...parsed.data,

    })

    console.log('bet placed', { userId: user.id, matchId: parsed.data.matchId, stake: parsed.data.stake })

    return json(req, { bet: result.bet, coinBalance: result.coinBalance }, result.created ? 201 : 200)

  } catch (e) {

    if (e instanceof BettingError) {

      console.log('bet rejected', { userId: user.id, reason: e.message })

      return error(req, e.message, e.status)

    }

    throw e

  }

})



export const config: Config = {

  path: '/api/bets',

}

