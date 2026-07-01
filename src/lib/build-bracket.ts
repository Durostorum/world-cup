import { BRACKET_LEFT_R32, BRACKET_RIGHT_R32, extraScoresFromResult, type BracketRound, type BracketSeedPair } from './bracket-structure'
import type { Match, MatchStatus, Team } from './types'

export interface BracketParticipant {
  fifaCode: string
  name: string
}

export interface BracketGame {
  id: string
  round: BracketRound | 'final' | 'bronze'
  side: 'left' | 'right' | 'center'
  slotIndex: number
  teamA: BracketParticipant | null
  teamB: BracketParticipant | null
  scoreA: number | null
  scoreB: number | null
  /** Penalty or ET score shown in brackets beside scoreA/B. */
  extraScoreA: number | null
  extraScoreB: number | null
  status: MatchStatus | 'pending'
  winnerCode: string | null
  loserCode: string | null
  matchId?: string
  fifaMatchNumber?: number
  /** null when the slot is not bettable (TBD teams). */
  bettingOpen: boolean | null
}

export interface BracketSide {
  r32: BracketGame[]
  r16: BracketGame[]
  qf: BracketGame[]
  sf: BracketGame[]
}

export interface KnockoutBracketState {
  left: BracketSide
  right: BracketSide
  final: BracketGame
  bronze: BracketGame
}

function normCode(code: string) {
  return code.toLowerCase().replace('gb-eng', 'eng')
}

function codesMatch(a: string, b: string) {
  return normCode(a) === normCode(b)
}

function toParticipant(team: Team): BracketParticipant {
  return { fifaCode: team.fifaCode, name: team.name }
}

function bettingMeta(
  api: Match | undefined,
  teamA: BracketParticipant | null,
  teamB: BracketParticipant | null,
) {
  if (!teamA || !teamB) {
    return { matchId: undefined, bettingOpen: null as boolean | null }
  }
  const matchId = api?.id
  if (!matchId) {
    return { matchId: undefined, bettingOpen: null as boolean | null }
  }
  return { matchId, bettingOpen: api?.bettingOpen === true }
}

function findApiMatch(matches: Match[], a: BracketParticipant, b: BracketParticipant, fifaMatchNumber?: number) {
  if (fifaMatchNumber != null) {
    const byNumber = matches.find((m) => m.fifaMatchNumber === fifaMatchNumber)
    if (byNumber) return byNumber
  }
  return matches.find(
    (m) =>
      (codesMatch(m.teamA.fifaCode, a.fifaCode) && codesMatch(m.teamB.fifaCode, b.fifaCode)) ||
      (codesMatch(m.teamA.fifaCode, b.fifaCode) && codesMatch(m.teamB.fifaCode, a.fifaCode)),
  )
}

function winnerFromMatch(match: Match | undefined): BracketParticipant | null {
  if (!match || match.status !== 'finished' || !match.winnerTeamId) return null
  if (match.winnerTeamId === match.teamA.id) return toParticipant(match.teamA)
  if (match.winnerTeamId === match.teamB.id) return toParticipant(match.teamB)
  return null
}

function loserFromMatch(match: Match | undefined): BracketParticipant | null {
  if (!match || match.status !== 'finished' || !match.winnerTeamId) return null
  if (match.winnerTeamId === match.teamA.id) return toParticipant(match.teamB)
  if (match.winnerTeamId === match.teamB.id) return toParticipant(match.teamA)
  return null
}

function resultFromSeed(seed: BracketSeedPair) {
  if (!seed.result) return null
  const r = seed.result
  const loserCode = codesMatch(r.winnerCode, seed.teamA.fifaCode) ? seed.teamB.fifaCode : seed.teamA.fifaCode
  const { extraScoreA, extraScoreB } = extraScoresFromResult(r)
  return {
    scoreA: r.scoreA,
    scoreB: r.scoreB,
    extraScoreA,
    extraScoreB,
    status: 'finished' as const,
    winnerCode: r.winnerCode,
    loserCode,
  }
}

function mergeResult(
  api: Match | undefined,
  seed: BracketSeedPair,
  teamA: BracketParticipant,
  teamB: BracketParticipant,
) {
  const fromApi = scoresForTeams(api, teamA, teamB)
  const seedExtra = extraScoresFromResult(seed.result)
  const hasApiScores = fromApi.scoreA != null && fromApi.scoreB != null

  if (hasApiScores) {
    const decidedBeyond90 =
      fromApi.winnerCode &&
      fromApi.scoreA === fromApi.scoreB &&
      (seedExtra.extraScoreA != null || seedExtra.extraScoreB != null) &&
      seed.fifaMatchNumber === api?.fifaMatchNumber
    return decidedBeyond90 ? { ...fromApi, ...seedExtra } : { ...fromApi, extraScoreA: null, extraScoreB: null }
  }

  const fromSeed = resultFromSeed(seed)
  if (fromSeed && (!api || api.status === 'finished' || fromApi.status === 'pending')) return fromSeed

  return { ...fromApi, extraScoreA: null, extraScoreB: null }
}

function scoresForTeams(match: Match | undefined, slotA: BracketParticipant, slotB: BracketParticipant) {
  if (!match) {
    return {
      scoreA: null,
      scoreB: null,
      extraScoreA: null,
      extraScoreB: null,
      status: 'pending' as const,
      winnerCode: null,
      loserCode: null,
    }
  }
  const flipped = codesMatch(match.teamA.fifaCode, slotB.fifaCode) && codesMatch(match.teamB.fifaCode, slotA.fifaCode)
  const scoreA = flipped ? match.scoreB : match.scoreA
  const scoreB = flipped ? match.scoreA : match.scoreB
  const winner = winnerFromMatch(match)
  const loser = loserFromMatch(match)
  const hasScores = scoreA != null && scoreB != null
  return {
    scoreA: hasScores ? scoreA : null,
    scoreB: hasScores ? scoreB : null,
    extraScoreA: null,
    extraScoreB: null,
    status: match.status,
    winnerCode: winner?.fifaCode ?? null,
    loserCode: loser?.fifaCode ?? null,
  }
}

function resolveR32(
  side: 'left' | 'right',
  seeds: BracketSeedPair[],
  matches: Match[],
): BracketGame[] {
  return seeds.map((seed, slotIndex) => {
    const teamA = seed.teamA
    const teamB = seed.teamB
    const api = findApiMatch(matches, teamA, teamB, seed.fifaMatchNumber)
    const result = mergeResult(api, seed, teamA, teamB)
    const link = bettingMeta(api, teamA, teamB)
    return {
      id: `${side}-r32-${slotIndex}`,
      round: 'r32',
      side,
      slotIndex,
      teamA,
      teamB,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      extraScoreA: result.extraScoreA ?? null,
      extraScoreB: result.extraScoreB ?? null,
      status: result.status !== 'pending' ? result.status : (api?.status ?? 'pending'),
      winnerCode: result.winnerCode,
      loserCode: result.loserCode,
      matchId: link.matchId,
      fifaMatchNumber: seed.fifaMatchNumber ?? api?.fifaMatchNumber,
      bettingOpen: link.bettingOpen,
    }
  })
}

function winnerOfGame(game: BracketGame): BracketParticipant | null {
  if (game.winnerCode && game.teamA && codesMatch(game.winnerCode, game.teamA.fifaCode)) return game.teamA
  if (game.winnerCode && game.teamB && codesMatch(game.winnerCode, game.teamB.fifaCode)) return game.teamB
  return null
}

function buildDerivedRound(
  side: 'left' | 'right',
  round: BracketRound,
  feeder: BracketGame[],
  matches: Match[],
): BracketGame[] {
  const count = feeder.length / 2
  const games: BracketGame[] = []

  for (let slotIndex = 0; slotIndex < count; slotIndex++) {
    const feederA = feeder[slotIndex * 2]
    const feederB = feeder[slotIndex * 2 + 1]
    const teamA = winnerOfGame(feederA)
    const teamB = winnerOfGame(feederB)

    const api =
      teamA && teamB ? findApiMatch(matches, teamA, teamB) : undefined
    const result =
      teamA && teamB ? scoresForTeams(api, teamA, teamB) : { scoreA: null, scoreB: null, extraScoreA: null, extraScoreB: null, status: 'pending' as const, winnerCode: null, loserCode: null }

    const link = bettingMeta(api, teamA, teamB)
    games.push({
      id: `${side}-${round}-${slotIndex}`,
      round,
      side,
      slotIndex,
      teamA,
      teamB,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      extraScoreA: result.extraScoreA ?? null,
      extraScoreB: result.extraScoreB ?? null,
      status: api?.status ?? (teamA && teamB ? 'scheduled' : 'pending'),
      winnerCode: result.winnerCode,
      loserCode: result.loserCode,
      matchId: link.matchId,
      fifaMatchNumber: api?.fifaMatchNumber,
      bettingOpen: link.bettingOpen,
    })
  }

  return games
}

function buildCenterGame(
  id: string,
  round: 'final' | 'bronze',
  teamA: BracketParticipant | null,
  teamB: BracketParticipant | null,
  matches: Match[],
): BracketGame {
  const api = teamA && teamB ? findApiMatch(matches, teamA, teamB) : undefined
  const result =
    teamA && teamB
      ? scoresForTeams(api, teamA, teamB)
      : { scoreA: null, scoreB: null, extraScoreA: null, extraScoreB: null, status: 'pending' as const, winnerCode: null, loserCode: null }

  const link = bettingMeta(api, teamA, teamB)
  return {
    id,
    round,
    side: 'center',
    slotIndex: 0,
    teamA,
    teamB,
    scoreA: result.scoreA,
    scoreB: result.scoreB,
    extraScoreA: result.extraScoreA ?? null,
    extraScoreB: result.extraScoreB ?? null,
    status: api?.status ?? (teamA && teamB ? 'scheduled' : 'pending'),
    winnerCode: result.winnerCode,
    loserCode: result.loserCode,
    matchId: link.matchId,
    fifaMatchNumber: api?.fifaMatchNumber,
    bettingOpen: link.bettingOpen,
  }
}

function loserOfGame(game: BracketGame): BracketParticipant | null {
  if (!game.loserCode) return null
  if (game.teamA && codesMatch(game.loserCode, game.teamA.fifaCode)) return game.teamA
  if (game.teamB && codesMatch(game.loserCode, game.teamB.fifaCode)) return game.teamB
  return null
}

export function buildKnockoutBracket(matches: Match[]): KnockoutBracketState {
  const leftR32 = resolveR32('left', BRACKET_LEFT_R32, matches)
  const rightR32 = resolveR32('right', BRACKET_RIGHT_R32, matches)

  const leftR16 = buildDerivedRound('left', 'r16', leftR32, matches)
  const rightR16 = buildDerivedRound('right', 'r16', rightR32, matches)

  const leftQf = buildDerivedRound('left', 'qf', leftR16, matches)
  const rightQf = buildDerivedRound('right', 'qf', rightR16, matches)

  const leftSf = buildDerivedRound('left', 'sf', leftQf, matches)
  const rightSf = buildDerivedRound('right', 'sf', rightQf, matches)

  const leftFinalist = winnerOfGame(leftSf[0])
  const rightFinalist = winnerOfGame(rightSf[0])

  return {
    left: { r32: leftR32, r16: leftR16, qf: leftQf, sf: leftSf },
    right: { r32: rightR32, r16: rightR16, qf: rightQf, sf: rightSf },
    final: buildCenterGame('final', 'final', leftFinalist, rightFinalist, matches),
    bronze: buildCenterGame('bronze', 'bronze', loserOfGame(leftSf[0]), loserOfGame(rightSf[0]), matches),
  }
}

/** Vertical offset so each round aligns with its feeder matches in the tree. */
export function bracketSlotOffset(roundIndex: number, slotIndex: number, unitPx: number) {
  const step = unitPx * 2 ** roundIndex
  return slotIndex * step + (step - unitPx) / 2
}
