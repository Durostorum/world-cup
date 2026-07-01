import type { Team as ApiTeam, Bet as ApiBet, Match as ApiMatch, Matchday } from '../../../src/lib/types.js'
import type { Team, Bet, Match, Matchday as DbMatchday } from '../../../db/schema.js'
import { isBettingOpen } from '../../../src/lib/betting-window.js'

export function toApiTeam(row: Team): ApiTeam {
  return {
    id: row.id,
    name: row.name,
    fifaCode: row.fifaCode,
    flagUrl: row.flagUrl ?? `https://flagcdn.com/w40/${row.fifaCode.toLowerCase()}.png`,
  }
}

export function toApiMatch(
  row: Match,
  teamA: Team,
  teamB: Team,
  matchday: DbMatchday | Matchday,
): ApiMatch {
  const md = {
    matchdayDate: String(matchday.matchdayDate),
    firstKickoffAt:
      matchday.firstKickoffAt instanceof Date
        ? matchday.firstKickoffAt.toISOString()
        : String(matchday.firstKickoffAt),
    bettingClosed: matchday.bettingClosed,
  }
  return {
    id: row.id,
    fifaMatchNumber: row.fifaMatchNumber,
    stage: row.stage,
    groupCode: row.groupCode,
    teamA: toApiTeam(teamA),
    teamB: toApiTeam(teamB),
    kickoffAt: row.kickoffAt.toISOString(),
    matchdayDate: String(row.matchdayDate),
    venue: row.venue ?? '',
    city: row.city ?? '',
    status: row.status,
    teamAOdds: row.teamAOdds != null ? Number(row.teamAOdds) : null,
    teamBOdds: row.teamBOdds != null ? Number(row.teamBOdds) : null,
    scoreA: row.scoreA,
    scoreB: row.scoreB,
    winnerTeamId: row.winnerTeamId,
    bettingOpen: isBettingOpen(md),
    bettingClosesAt: md.firstKickoffAt,
  }
}

export function toApiBet(row: Bet, pickedTeam: Team): ApiBet {
  return {
    id: row.id,
    userId: row.userId,
    matchId: row.matchId,
    pickedTeamId: row.pickedTeamId,
    pickedTeam: toApiTeam(pickedTeam),
    stake: row.stake,
    oddsAtLock: row.oddsAtLock != null ? Number(row.oddsAtLock) : null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}
