import type { Bet, LeaderboardEntry, Match, Matchday, Team, UserProfile } from '../../src/lib/types.js'
import { isBettingOpen, getMatchdayDate } from '../../src/lib/betting-window.js'

export function team(id: string, name: string, fifaCode: string): Team {
  return {
    id,
    name,
    fifaCode,
    flagUrl: `https://flagcdn.com/w40/${fifaCode.toLowerCase()}.png`,
  }
}

const teams = {
  usa: team('t-usa', 'USA', 'us'),
  paraguay: team('t-py', 'Paraguay', 'py'),
  netherlands: team('t-nl', 'Netherlands', 'nl'),
  japan: team('t-jp', 'Japan', 'jp'),
  spain: team('t-es', 'Spain', 'es'),
  costaRica: team('t-cr', 'Costa Rica', 'cr'),
  brazil: team('t-br', 'Brazil', 'br'),
  morocco: team('t-ma', 'Morocco', 'ma'),
  france: team('t-fr', 'France', 'fr'),
  canada: team('t-ca', 'Canada', 'ca'),
  germany: team('t-de', 'Germany', 'de'),
  curacao: team('t-cw', 'Curaçao', 'cw'),
}

export const matchdays: Matchday[] = [
  {
    matchdayDate: '2026-06-15',
    firstKickoffAt: '2026-06-15T14:00:00-04:00',
    bettingClosed: false,
  },
]

function enrichMatch(m: Omit<Match, 'bettingOpen' | 'bettingClosesAt'>): Match {
  const md = matchdays.find((d) => d.matchdayDate === m.matchdayDate) ?? {
    matchdayDate: m.matchdayDate,
    firstKickoffAt: m.kickoffAt,
    bettingClosed: false,
  }
  return {
    ...m,
    bettingOpen: isBettingOpen(md),
    bettingClosesAt: md.firstKickoffAt,
  }
}

export const matches: Match[] = [
  enrichMatch({
    id: 'm-25',
    fifaMatchNumber: 25,
    stage: 'group_d',
    groupCode: 'D',
    teamA: teams.usa,
    teamB: teams.paraguay,
    kickoffAt: '2026-06-15T14:00:00-04:00',
    matchdayDate: '2026-06-15',
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    status: 'scheduled',
    teamAOdds: 1.45,
    teamBOdds: 2.8,
    scoreA: null,
    scoreB: null,
    winnerTeamId: null,
  }),
  enrichMatch({
    id: 'm-26',
    fifaMatchNumber: 26,
    stage: 'group_f',
    groupCode: 'F',
    teamA: teams.netherlands,
    teamB: teams.japan,
    kickoffAt: '2026-06-15T17:00:00-04:00',
    matchdayDate: '2026-06-15',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    status: 'scheduled',
    teamAOdds: 1.62,
    teamBOdds: 2.35,
    scoreA: null,
    scoreB: null,
    winnerTeamId: null,
  }),
  enrichMatch({
    id: 'm-27',
    fifaMatchNumber: 27,
    stage: 'group_h',
    groupCode: 'H',
    teamA: teams.spain,
    teamB: teams.costaRica,
    kickoffAt: '2026-06-15T20:00:00-04:00',
    matchdayDate: '2026-06-15',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    status: 'scheduled',
    teamAOdds: 1.38,
    teamBOdds: 3.1,
    scoreA: null,
    scoreB: null,
    winnerTeamId: null,
  }),
]

export interface StoreUser extends UserProfile {
  passwordHash?: never
}

export const users: StoreUser[] = [
  {
    id: 'u-demo',
    email: 'demo@example.com',
    displayName: 'Georgi K.',
    coinBalance: 8450,
    totalPredictions: 17,
    correctPredictions: 9,
  },
  {
    id: 'u-maria',
    email: 'maria@example.com',
    displayName: 'Maria S.',
    coinBalance: 14820,
    totalPredictions: 19,
    correctPredictions: 13,
  },
  {
    id: 'u-james',
    email: 'james@example.com',
    displayName: 'James T.',
    coinBalance: 12350,
    totalPredictions: 18,
    correctPredictions: 11,
  },
]

export let bets: Bet[] = [
  {
    id: 'b-1',
    userId: 'u-demo',
    matchId: 'm-25',
    pickedTeamId: 't-usa',
    pickedTeam: teams.usa,
    stake: 500,
    oddsAtLock: null,
    status: 'open',
    createdAt: '2026-06-15T08:00:00Z',
  },
  {
    id: 'b-2',
    userId: 'u-maria',
    matchId: 'm-25',
    pickedTeamId: 't-usa',
    pickedTeam: teams.usa,
    stake: 1200,
    oddsAtLock: null,
    status: 'open',
    createdAt: '2026-06-15T07:30:00Z',
  },
  {
    id: 'b-3',
    userId: 'u-james',
    matchId: 'm-25',
    pickedTeamId: 't-py',
    pickedTeam: teams.paraguay,
    stake: 800,
    oddsAtLock: null,
    status: 'open',
    createdAt: '2026-06-15T09:00:00Z',
  },
]

export function getLeaderboard(currentUserId = 'u-demo'): LeaderboardEntry[] {
  return [...users]
    .sort((a, b) => b.coinBalance - a.coinBalance)
    .map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      displayName: u.displayName,
      coinBalance: u.coinBalance,
      accuracyPct:
        u.totalPredictions > 0
          ? Math.round((1000 * u.correctPredictions) / u.totalPredictions) / 10
          : 0,
      totalBets: u.totalPredictions,
      isCurrentUser: u.id === currentUserId,
    }))
}

export function getBetHistory(matchId: string) {
  return bets
    .filter((b) => b.matchId === matchId)
    .map((b) => {
      const u = users.find((x) => x.id === b.userId)!
      return {
        userId: b.userId,
        displayName: u.displayName,
        pickedTeam: b.pickedTeam,
        stake: b.stake,
      }
    })
}

export { getMatchdayDate }
