import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { bets, matches, users } from './shared/store.js'
import { error, getUserId, handleOptions, json, parseBody } from './shared/http.js'
import { isBettingOpen } from '../../src/lib/betting-window.js'
import { matchdays } from './shared/store.js'

const betSchema = z.object({
  matchId: z.string().min(1),
  pickedTeamId: z.string().min(1),
  stake: z.number().int().positive().max(1_000_000),
})

export default async (req: Request) {
  const opt = handleOptions(req)
  if (opt) return opt

  const userId = getUserId(req)

  if (req.method === 'GET') {
    const userBets = bets.filter((b) => b.userId === userId)
    return json({ bets: userBets })
  }

  if (req.method !== 'POST') return error('Method not allowed', 405)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error('Invalid JSON body', 400)
  }

  const parsed = parseBody(betSchema, body)
  if (!parsed.ok) return error(parsed.error, 400)

  const { matchId, pickedTeamId, stake } = parsed.data
  const match = matches.find((m) => m.id === matchId)
  if (!match) return error('Match not found', 404)
  if (match.status !== 'scheduled') return error('Match is not open for betting', 400)

  const md = matchdays.find((d) => d.matchdayDate === match.matchdayDate)
  if (!md || !isBettingOpen(md)) {
    return error('Betting is closed for this matchday', 400)
  }

  if (pickedTeamId !== match.teamA.id && pickedTeamId !== match.teamB.id) {
    return error('Invalid team selection', 400)
  }

  const odds =
    pickedTeamId === match.teamA.id ? match.teamAOdds : match.teamBOdds
  if (odds == null) return error('Odds not available', 400)

  const user = users.find((u) => u.id === userId)
  if (!user) return error('User not found', 404)

  const existing = bets.find((b) => b.userId === userId && b.matchId === matchId)

  if (existing && existing.pickedTeamId !== pickedTeamId) {
    return error('Cannot switch team after placing a bet', 400)
  }

  const delta = existing ? stake - existing.stake : stake
  if (delta <= 0 && existing) {
    return error('Stake can only be increased', 400)
  }
  if (delta > user.coinBalance) {
    return error('Insufficient coin balance', 400)
  }

  user.coinBalance -= delta

  if (existing) {
    existing.stake = stake
    return json({ bet: existing, coinBalance: user.coinBalance })
  }

  const pickedTeam = pickedTeamId === match.teamA.id ? match.teamA : match.teamB
  const bet = {
    id: `b-${Date.now()}`,
    userId,
    matchId,
    pickedTeamId,
    pickedTeam,
    stake,
    oddsAtLock: null,
    status: 'open' as const,
    createdAt: new Date().toISOString(),
  }
  bets.push(bet)
  return json({ bet, coinBalance: user.coinBalance }, 201)
}

export const config: Config = {
  path: '/bets',
}
