import type { Bet, BetHistoryEntry, LeaderboardEntry, Match, UserProfile } from './types'

const teams = {
  usa: { id: 't-usa', name: 'USA', fifaCode: 'us', flagUrl: 'https://flagcdn.com/w40/us.png' },
  paraguay: { id: 't-py', name: 'Paraguay', fifaCode: 'py', flagUrl: 'https://flagcdn.com/w40/py.png' },
  netherlands: { id: 't-nl', name: 'Netherlands', fifaCode: 'nl', flagUrl: 'https://flagcdn.com/w40/nl.png' },
  japan: { id: 't-jp', name: 'Japan', fifaCode: 'jp', flagUrl: 'https://flagcdn.com/w40/jp.png' },
  spain: { id: 't-es', name: 'Spain', fifaCode: 'es', flagUrl: 'https://flagcdn.com/w40/es.png' },
  costaRica: { id: 't-cr', name: 'Costa Rica', fifaCode: 'cr', flagUrl: 'https://flagcdn.com/w40/cr.png' },
}

export const mockMatches: Match[] = [
  {
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
    bettingOpen: true,
    bettingClosesAt: '2026-06-15T14:00:00-04:00',
  },
  {
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
    bettingOpen: true,
    bettingClosesAt: '2026-06-15T14:00:00-04:00',
  },
  {
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
    bettingOpen: true,
    bettingClosesAt: '2026-06-15T14:00:00-04:00',
  },
]

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u-maria', displayName: 'Maria S.', coinBalance: 14820, accuracyPct: 68.4, totalBets: 19 },
  { rank: 2, userId: 'u-james', displayName: 'James T.', coinBalance: 12350, accuracyPct: 61.1, totalBets: 18 },
  { rank: 7, userId: 'u-demo', displayName: 'Georgi K.', coinBalance: 8450, accuracyPct: 52.9, totalBets: 17, isCurrentUser: true },
]

export const mockBetHistory: BetHistoryEntry[] = [
  { userId: 'u-demo', displayName: 'Georgi K.', pickedTeam: teams.usa, stake: 500 },
  { userId: 'u-maria', displayName: 'Maria S.', pickedTeam: teams.usa, stake: 1200 },
  { userId: 'u-james', displayName: 'James T.', pickedTeam: teams.paraguay, stake: 800 },
]

export const mockUser: UserProfile = {
  id: 'u-demo',
  email: 'demo@example.com',
  displayName: 'Georgi K.',
  coinBalance: 8450,
  totalPredictions: 17,
  correctPredictions: 9,
}

export const mockBets: Bet[] = [
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
]
