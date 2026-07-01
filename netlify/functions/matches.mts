import type { Config } from '@netlify/functions'

import { getBetHistory } from './shared/betting.js'

import { error, json, withApiHandler } from './shared/http.js'

import { getMatchById, listMatches } from './shared/queries.js'



export default withApiHandler(async (req: Request) => {

  if (req.method !== 'GET') return error(req, 'Method not allowed', 405)



  const url = new URL(req.url)

  const id = url.searchParams.get('id')



  if (id) {

    const match = await getMatchById(id)

    if (!match) return error(req, 'Match not found', 404)

    const betHistory = await getBetHistory(id)

    return json(req, { match, betHistory })

  }



  const matches = await listMatches()

  return json(req, { matches })

})



export const config: Config = {

  path: '/api/matches',

}

