import { isBettingOpen } from './betting-window'
import { WC2026_FIXTURES, WC2026_TEAMS, type FixtureSeed } from './fixtures/wc2026'
import type { Match, Team } from './types'

const TEAMS = Object.fromEntries(WC2026_TEAMS.map((t) => [t.fifaCode, { name: t.name }]))

function stableTeamId(fifaCode: string) {
  const hex = [...fifaCode.toLowerCase().padEnd(3, '0')]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(12, '0')
    .slice(0, 12)
  return `00000000-0000-4000-a000-${hex}`
}

export function stableMatchId(fifaMatchNumber: number) {
  return `00000000-0000-4000-8000-${String(fifaMatchNumber).padStart(12, '0')}`
}

function toTeam(fifaCode: string): Team {
  const code = fifaCode.toLowerCase()
  return {
    id: stableTeamId(code),
    name: TEAMS[code]?.name ?? code.toUpperCase(),
    fifaCode: code,
    flagUrl: `https://flagcdn.com/w40/${code.replace('gb-eng', 'gb')}.png`,
  }
}

function buildMatchdayMeta() {
  const byDate = new Map<string, { firstKickoffAt: string; bettingClosed: boolean }>()

  for (const fixture of WC2026_FIXTURES) {
    const kickoff = new Date(fixture.kickoffAt).toISOString()
    const existing = byDate.get(fixture.matchdayDate)
    if (!existing || kickoff < existing.firstKickoffAt) {
      byDate.set(fixture.matchdayDate, {
        firstKickoffAt: kickoff,
        bettingClosed: WC2026_FIXTURES.filter((f) => f.matchdayDate === fixture.matchdayDate).every(
          (f) => f.status === 'finished',
        ),
      })
    }
  }

  return byDate
}

const MATCHDAY_META = buildMatchdayMeta()

function fixtureToMatch(fixture: FixtureSeed): Match {
  const teamA = toTeam(fixture.teamA)
  const teamB = toTeam(fixture.teamB)
  const winnerTeamId =
    fixture.winnerSide === 'A' ? teamA.id : fixture.winnerSide === 'B' ? teamB.id : null
  const md = MATCHDAY_META.get(fixture.matchdayDate)!
  const bettingOpen =
    fixture.status === 'scheduled' &&
    isBettingOpen({ matchdayDate: fixture.matchdayDate, ...md })

  return {
    id: stableMatchId(fixture.fifaMatchNumber),
    fifaMatchNumber: fixture.fifaMatchNumber,
    stage: fixture.stage,
    groupCode: fixture.groupCode,
    teamA,
    teamB,
    kickoffAt: new Date(fixture.kickoffAt).toISOString(),
    matchdayDate: fixture.matchdayDate,
    venue: fixture.venue,
    city: fixture.city,
    status: fixture.status,
    teamAOdds: Number(fixture.teamAOdds),
    teamBOdds: Number(fixture.teamBOdds),
    scoreA: fixture.scoreA ?? null,
    scoreB: fixture.scoreB ?? null,
    winnerTeamId,
    bettingOpen,
    bettingClosesAt: md.firstKickoffAt,
  }
}

const CATALOG = WC2026_FIXTURES.map(fixtureToMatch)

/** Merge API matches with the local fixture catalog (API wins on conflict). */
export function mergeWithFixtureCatalog(apiMatches: Match[]): Match[] {
  const apiByFifa = new Map(apiMatches.map((m) => [m.fifaMatchNumber, m]))
  const merged = CATALOG.map((fixture) => apiByFifa.get(fixture.fifaMatchNumber) ?? fixture)

  for (const match of apiMatches) {
    if (!CATALOG.some((f) => f.fifaMatchNumber === match.fifaMatchNumber)) {
      merged.push(match)
    }
  }

  return merged
}

export function matchdayKey(match: Match): string {
  return String(match.matchdayDate).slice(0, 10)
}
