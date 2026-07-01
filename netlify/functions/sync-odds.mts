import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { matches, teams } from '../../db/schema.js'

interface OddsApiResponse {
  data: Array<{
    id: string
    home_team: string
    away_team: string
    bookmakers: Array<{
      markets: Array<{
        name: string
        outcomes: Array<{
          name: string
          price: number
        }>
      }>
    }>
  }>
}

/**
 * Daily (~midnight Eastern): refresh odds for scheduled matches.
 * Requires ODDS_API_KEY from The-Odds API (https://the-odds-api.com).
 */
export default async () => {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) {
    console.log('sync-odds: skipped — ODDS_API_KEY not configured')
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: 'ODDS_API_KEY not configured' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const db = getDb()
    const scheduledMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'scheduled'))

    // Fetch odds from The Odds API for FIFA World Cup 2026
    const oddsApiUrl = 'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_2026/odds'
    const response = await fetch(
      `${oddsApiUrl}?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`
    )

    if (!response.ok) {
      console.error('sync-odds: API request failed', response.status, response.statusText)
      return new Response(
        JSON.stringify({ ok: false, error: 'Odds API request failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const oddsData = (await response.json()) as OddsApiResponse

    // Build a map of team IDs to names for matching
    const allTeams = await db.select().from(teams)
    const teamIdToName = new Map(allTeams.map((t) => [t.id, t.name]))

    let updatedCount = 0

    for (const match of scheduledMatches) {
      const teamAName = teamIdToName.get(match.teamAId)
      const teamBName = teamIdToName.get(match.teamBId)

      if (!teamAName || !teamBName) continue

      // Find matching odds by team names
      const oddsMatch = oddsData.data.find(
        (m) =>
          m.home_team.toLowerCase() === teamAName.toLowerCase() &&
          m.away_team.toLowerCase() === teamBName.toLowerCase()
      )

      if (!oddsMatch) continue

      // Extract h2h odds
      const h2hMarket = oddsMatch.bookmakers[0]?.markets.find((m) => m.name === 'h2h')
      if (!h2hMarket) continue

      const homeOdds = h2hMarket.outcomes.find((o) => o.name === oddsMatch.home_team)?.price
      const awayOdds = h2hMarket.outcomes.find((o) => o.name === oddsMatch.away_team)?.price

      if (homeOdds && awayOdds) {
        await db
          .update(matches)
          .set({
            teamAOdds: String(homeOdds),
            teamBOdds: String(awayOdds),
            oddsUpdatedAt: new Date(),
          })
          .where(eq(matches.id, match.id))
        updatedCount++
      }
    }

    console.log(`sync-odds: updated odds for ${updatedCount} matches`)

    return new Response(
      JSON.stringify({
        ok: true,
        updated: updatedCount,
        total: scheduledMatches.length,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('sync-odds failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Odds sync failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
