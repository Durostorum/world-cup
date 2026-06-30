export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'
export type BetStatus = 'open' | 'locked' | 'won' | 'lost'

export interface Team {
  id: string
  name: string
  fifaCode: string
  flagUrl: string
}

export interface Matchday {
  matchdayDate: string
  firstKickoffAt: string
  bettingClosed: boolean
}

export interface Match {
  id: string
  fifaMatchNumber: number
  stage: string
  groupCode: string | null
  teamA: Team
  teamB: Team
  kickoffAt: string
  matchdayDate: string
  venue: string
  city: string
  status: MatchStatus
  teamAOdds: number | null
  teamBOdds: number | null
  scoreA: number | null
  scoreB: number | null
  winnerTeamId: string | null
  bettingOpen: boolean
  bettingClosesAt: string
}

export interface Bet {
  id: string
  userId: string
  matchId: string
  pickedTeamId: string
  pickedTeam: Team
  stake: number
  oddsAtLock: number | null
  status: BetStatus
  createdAt: string
}

export interface BetHistoryEntry {
  userId: string
  displayName: string
  pickedTeam: Team
  stake: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  coinBalance: number
  accuracyPct: number
  totalBets: number
  isCurrentUser?: boolean
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  coinBalance: number
  totalPredictions: number
  correctPredictions: number
}
