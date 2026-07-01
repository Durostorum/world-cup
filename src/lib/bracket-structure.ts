/** Static Round of 32 pairings — order defines who meets in the Round of 16. */
/** How a knockout match was decided beyond 90 minutes. */
export type MatchDecidedBy = 'regular' | 'extra_time' | 'penalties'

export interface BracketSeedResult {
  /** Score after 90 minutes (and extra time if noted separately). */
  scoreA: number
  scoreB: number
  /** fifaCode of the winning team (seed teamA/teamB order). */
  winnerCode: string
  decidedBy?: MatchDecidedBy
  /** Penalty shootout score (team A – team B). */
  pensA?: number
  pensB?: number
  /** Total score after extra time when decidedBy is extra_time. */
  etScoreA?: number
  etScoreB?: number
}

export interface BracketSeedPair {
  teamA: { fifaCode: string; name: string }
  teamB: { fifaCode: string; name: string }
  fifaMatchNumber?: number
  /** Fallback when API match is missing or not yet synced. */
  result?: BracketSeedResult
}

export const BRACKET_LEFT_R32: BracketSeedPair[] = [
  {
    teamA: { fifaCode: 'de', name: 'Germany' },
    teamB: { fifaCode: 'py', name: 'Paraguay' },
    fifaMatchNumber: 75,
    result: { scoreA: 1, scoreB: 1, winnerCode: 'py', decidedBy: 'penalties', pensA: 3, pensB: 4 },
  },
  { teamA: { fifaCode: 'fr', name: 'France' }, teamB: { fifaCode: 'se', name: 'Sweden' }, fifaMatchNumber: 77 },
  {
    teamA: { fifaCode: 'za', name: 'South Africa' },
    teamB: { fifaCode: 'ca', name: 'Canada' },
    fifaMatchNumber: 73,
    result: { scoreA: 0, scoreB: 1, winnerCode: 'ca' },
  },
  {
    teamA: { fifaCode: 'nl', name: 'Netherlands' },
    teamB: { fifaCode: 'ma', name: 'Morocco' },
    fifaMatchNumber: 76,
    result: { scoreA: 1, scoreB: 1, winnerCode: 'ma', decidedBy: 'penalties', pensA: 2, pensB: 3 },
  },
  { teamA: { fifaCode: 'pt', name: 'Portugal' }, teamB: { fifaCode: 'hr', name: 'Croatia' }, fifaMatchNumber: 81 },
  { teamA: { fifaCode: 'es', name: 'Spain' }, teamB: { fifaCode: 'at', name: 'Austria' }, fifaMatchNumber: 85 },
  { teamA: { fifaCode: 'us', name: 'United States' }, teamB: { fifaCode: 'ba', name: 'Bosnia-Herz.' }, fifaMatchNumber: 87 },
  { teamA: { fifaCode: 'be', name: 'Belgium' }, teamB: { fifaCode: 'sn', name: 'Senegal' }, fifaMatchNumber: 82 },
]

export const BRACKET_RIGHT_R32: BracketSeedPair[] = [
  {
    teamA: { fifaCode: 'br', name: 'Brazil' },
    teamB: { fifaCode: 'jp', name: 'Japan' },
    fifaMatchNumber: 74,
    result: { scoreA: 2, scoreB: 1, winnerCode: 'br' },
  },
  { teamA: { fifaCode: 'ci', name: 'Ivory Coast' }, teamB: { fifaCode: 'no', name: 'Norway' }, fifaMatchNumber: 78 },
  { teamA: { fifaCode: 'mx', name: 'Mexico' }, teamB: { fifaCode: 'ec', name: 'Ecuador' }, fifaMatchNumber: 79 },
  { teamA: { fifaCode: 'gb-eng', name: 'England' }, teamB: { fifaCode: 'cd', name: 'DR Congo' }, fifaMatchNumber: 84 },
  { teamA: { fifaCode: 'ar', name: 'Argentina' }, teamB: { fifaCode: 'cv', name: 'Cape Verde' }, fifaMatchNumber: 86 },
  { teamA: { fifaCode: 'au', name: 'Australia' }, teamB: { fifaCode: 'eg', name: 'Egypt' }, fifaMatchNumber: 83 },
  { teamA: { fifaCode: 'ch', name: 'Switzerland' }, teamB: { fifaCode: 'dz', name: 'Algeria' }, fifaMatchNumber: 88 },
  { teamA: { fifaCode: 'co', name: 'Colombia' }, teamB: { fifaCode: 'gh', name: 'Ghana' }, fifaMatchNumber: 80 },
]

export type BracketRound = 'r32' | 'r16' | 'qf' | 'sf'

export const ROUND_LABELS: Record<BracketRound | 'final' | 'bronze', string> = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  final: 'Final',
  bronze: '3rd place',
}

/** Pen / ET scores shown in brackets beside the 90-minute score for each team. */
export function extraScoresFromResult(result: BracketSeedResult | undefined): {
  extraScoreA: number | null
  extraScoreB: number | null
} {
  if (!result?.decidedBy || result.decidedBy === 'regular') {
    return { extraScoreA: null, extraScoreB: null }
  }
  if (result.decidedBy === 'penalties' && result.pensA != null && result.pensB != null) {
    return { extraScoreA: result.pensA, extraScoreB: result.pensB }
  }
  if (result.decidedBy === 'extra_time' && result.etScoreA != null && result.etScoreB != null) {
    return { extraScoreA: result.etScoreA, extraScoreB: result.etScoreB }
  }
  return { extraScoreA: null, extraScoreB: null }
}
