import { eq, notInArray } from 'drizzle-orm'
import { getDb } from '../../../db/index.js'
import { matchdays, matches, teams } from '../../../db/schema.js'
import { WC2026_FIXTURES, WC2026_TEAMS } from '../../../src/lib/fixtures/wc2026.js'
import { stableMatchId, stableTeamId } from '../../../src/lib/stable-ids.js'

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

async function upsertTeams() {
  const db = getDb()
  const byCode = new Map<string, string>()

  for (const team of WC2026_TEAMS) {
    const id = stableTeamId(team.fifaCode)
    const [existing] = await db.select().from(teams).where(eq(teams.fifaCode, team.fifaCode)).limit(1)
    if (existing) {
      byCode.set(team.fifaCode, existing.id)
      continue
    }
    const [created] = await db
      .insert(teams)
      .values({
        id,
        name: team.name,
        fifaCode: team.fifaCode,
        flagUrl: flagUrl(team.fifaCode),
      })
      .onConflictDoNothing()
      .returning()
    if (created) {
      byCode.set(team.fifaCode, created.id)
    } else {
      byCode.set(team.fifaCode, id)
    }
  }

  return byCode
}

async function upsertMatchdays() {
  const db = getDb()
  const byDate = new Map<string, { firstKickoffAt: Date; bettingClosed: boolean }>()

  for (const fixture of WC2026_FIXTURES) {
    const kickoff = new Date(fixture.kickoffAt)
    const existing = byDate.get(fixture.matchdayDate)
    if (!existing || kickoff < existing.firstKickoffAt) {
      byDate.set(fixture.matchdayDate, {
        firstKickoffAt: kickoff,
        bettingClosed: fixture.status === 'finished',
      })
    } else if (fixture.status === 'finished') {
      existing.bettingClosed = true
    }
  }

  for (const [matchdayDate, meta] of byDate) {
    await db
      .insert(matchdays)
      .values({
        matchdayDate,
        firstKickoffAt: meta.firstKickoffAt,
        bettingClosed: meta.bettingClosed,
      })
      .onConflictDoUpdate({
        target: matchdays.matchdayDate,
        set: {
          firstKickoffAt: meta.firstKickoffAt,
          bettingClosed: meta.bettingClosed,
        },
      })
  }
}

async function syncFixtures(teamIds: Map<string, string>) {
  const db = getDb()
  const fixtureNumbers = WC2026_FIXTURES.map((f) => f.fifaMatchNumber)

  for (const fixture of WC2026_FIXTURES) {
    const teamAId = teamIds.get(fixture.teamA)!
    const teamBId = teamIds.get(fixture.teamB)!
    const winnerTeamId =
      fixture.winnerSide === 'A' ? teamAId : fixture.winnerSide === 'B' ? teamBId : null

    const values = {
      id: stableMatchId(fixture.fifaMatchNumber),
      fifaMatchNumber: fixture.fifaMatchNumber,
      stage: fixture.stage,
      groupCode: fixture.groupCode,
      teamAId,
      teamBId,
      kickoffAt: new Date(fixture.kickoffAt),
      matchdayDate: fixture.matchdayDate,
      venue: fixture.venue,
      city: fixture.city,
      status: fixture.status,
      scoreA: fixture.scoreA ?? null,
      scoreB: fixture.scoreB ?? null,
      winnerTeamId,
      teamAOdds: fixture.teamAOdds,
      teamBOdds: fixture.teamBOdds,
    }

    const [existing] = await db
      .select()
      .from(matches)
      .where(eq(matches.fifaMatchNumber, fixture.fifaMatchNumber))
      .limit(1)

    if (existing) {
      await db.update(matches).set(values).where(eq(matches.id, existing.id))
    } else {
      await db.insert(matches).values(values).onConflictDoNothing()
    }
  }

  await db.delete(matches).where(notInArray(matches.fifaMatchNumber, fixtureNumbers))
}

/** Idempotent seed of teams, matchdays, and fixtures. */
export async function runSeed() {
  const teamIds = await upsertTeams()
  await upsertMatchdays()
  await syncFixtures(teamIds)
  return WC2026_FIXTURES.length
}

/** Seeds production/preview when SEED_ON_EMPTY=true and the matches table is empty. */
export async function seedIfEmpty() {
  if (process.env.SEED_ON_EMPTY !== 'true') return false
  const db = getDb()
  const rows = await db.select({ id: matches.id }).from(matches).limit(1)
  if (rows.length > 0) return false
  await runSeed()
  console.log('seed-if-empty: fixtures loaded')
  return true
}
