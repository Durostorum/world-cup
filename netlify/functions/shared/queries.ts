import { desc, eq } from 'drizzle-orm'
import { getDb } from '../../../db/index.js'
import { matchdays, matches, teams, users } from '../../../db/schema.js'
import { seedIfEmpty } from './seed-data.js'
import { toApiMatch } from './mappers.js'

export async function listMatches() {
  await seedIfEmpty()
  const db = getDb()
  const rows = await db
    .select({
      match: matches,
      teamA: teams,
      matchday: matchdays,
    })
    .from(matches)
    .innerJoin(teams, eq(matches.teamAId, teams.id))
    .innerJoin(matchdays, eq(matches.matchdayDate, matchdays.matchdayDate))
    .orderBy(matches.kickoffAt)

  const result = []
  for (const row of rows) {
    const [teamB] = await db.select().from(teams).where(eq(teams.id, row.match.teamBId)).limit(1)
    if (!teamB) continue
    result.push(toApiMatch(row.match, row.teamA, teamB, row.matchday))
  }
  return result
}

export async function getMatchById(id: string) {
  const db = getDb()
  const rows = await db
    .select({
      match: matches,
      teamA: teams,
      matchday: matchdays,
    })
    .from(matches)
    .innerJoin(teams, eq(matches.teamAId, teams.id))
    .innerJoin(matchdays, eq(matches.matchdayDate, matchdays.matchdayDate))
    .where(eq(matches.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const [teamB] = await db.select().from(teams).where(eq(teams.id, row.match.teamBId)).limit(1)
  if (!teamB) return null

  return toApiMatch(row.match, row.teamA, teamB, row.matchday)
}

export async function getLeaderboard(currentUserId: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(users)
    .orderBy(desc(users.coinBalance))

  return rows.map((u, i) => ({
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
