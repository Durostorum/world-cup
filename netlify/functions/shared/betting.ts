import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { getDb } from '../../../db/index.js'
import {
  bets,
  coinTransactions,
  matchdays,
  matches,
  teams,
  users,
  type Bet,
  type Team,
} from '../../../db/schema.js'
import { isBettingOpen } from '../../../src/lib/betting-window.js'
import { toApiBet } from './mappers.js'

export class BettingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'BettingError'
  }
}

export interface PlaceBetInput {
  userId: string
  matchId: string
  pickedTeamId: string
  stake: number
}

export interface PlaceBetResult {
  bet: ReturnType<typeof toApiBet>
  coinBalance: number
  created: boolean
}

async function loadMatchContext(matchId: string) {
  const db = getDb()
  const rows = await db
    .select({
      match: matches,
      teamA: teams,
      teamB: teams,
      matchday: matchdays,
    })
    .from(matches)
    .innerJoin(teams, eq(matches.teamAId, teams.id))
    .innerJoin(matchdays, eq(matches.matchdayDate, matchdays.matchdayDate))
    .where(eq(matches.id, matchId))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const [teamB] = await db.select().from(teams).where(eq(teams.id, row.match.teamBId)).limit(1)
  if (!teamB) return null

  return { match: row.match, teamA: row.teamA, teamB, matchday: row.matchday }
}

export async function placeBet(input: PlaceBetInput): Promise<PlaceBetResult> {
  const ctx = await loadMatchContext(input.matchId)
  if (!ctx) throw new BettingError('Match not found', 404)

  const { match, teamA, teamB, matchday } = ctx

  if (match.status !== 'scheduled') {
    throw new BettingError('Match is not open for betting')
  }

  const md = {
    matchdayDate: String(matchday.matchdayDate),
    firstKickoffAt: matchday.firstKickoffAt,
    bettingClosed: matchday.bettingClosed,
  }
  if (!isBettingOpen(md)) {
    throw new BettingError('Betting is closed for this matchday')
  }

  if (input.pickedTeamId !== teamA.id && input.pickedTeamId !== teamB.id) {
    throw new BettingError('Invalid team selection')
  }

  const odds =
    input.pickedTeamId === teamA.id
      ? match.teamAOdds != null
        ? Number(match.teamAOdds)
        : null
      : match.teamBOdds != null
        ? Number(match.teamBOdds)
        : null
  if (odds == null) throw new BettingError('Odds not available')

  const pickedTeam = input.pickedTeamId === teamA.id ? teamA : teamB
  const db = getDb()

  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, input.userId)).for('update')
    if (!user) throw new BettingError('User not found', 404)

    const [existing] = await tx
      .select()
      .from(bets)
      .where(and(eq(bets.userId, input.userId), eq(bets.matchId, input.matchId)))
      .limit(1)

    if (existing && existing.pickedTeamId !== input.pickedTeamId) {
      throw new BettingError('Cannot switch team after placing a bet')
    }

    if (existing && existing.status !== 'open') {
      throw new BettingError('Bet is locked and cannot be changed')
    }

    const delta = existing ? input.stake - existing.stake : input.stake
    if (existing && delta <= 0) {
      throw new BettingError('Stake can only be increased')
    }
    if (delta > user.coinBalance) {
      throw new BettingError('Insufficient coin balance')
    }

    let betRow: Bet
    let created = false

    if (existing) {
      const [updated] = await tx
        .update(bets)
        .set({ stake: input.stake })
        .where(eq(bets.id, existing.id))
        .returning()
      betRow = updated
    } else {
      const [inserted] = await tx
        .insert(bets)
        .values({
          userId: input.userId,
          matchId: input.matchId,
          pickedTeamId: input.pickedTeamId,
          stake: input.stake,
        })
        .returning()
      betRow = inserted
      created = true
    }

    const [updatedUser] = await tx
      .update(users)
      .set({ coinBalance: user.coinBalance - delta })
      .where(eq(users.id, input.userId))
      .returning()

    await tx.insert(coinTransactions).values({
      userId: input.userId,
      amount: -delta,
      reason: existing ? 'bet_increase' : 'bet_placed',
      referenceId: betRow.id,
    })

    return {
      bet: toApiBet(betRow, pickedTeam),
      coinBalance: updatedUser.coinBalance,
      created,
    }
  })
}

export async function listUserBets(userId: string) {
  const db = getDb()
  const rows = await db
    .select({ bet: bets, pickedTeam: teams })
    .from(bets)
    .innerJoin(teams, eq(bets.pickedTeamId, teams.id))
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.createdAt))

  return rows.map((r) => toApiBet(r.bet, r.pickedTeam))
}

export async function getBetHistory(matchId: string) {
  const db = getDb()
  const rows = await db
    .select({
      userId: bets.userId,
      displayName: users.displayName,
      pickedTeam: teams,
      stake: bets.stake,
    })
    .from(bets)
    .innerJoin(users, eq(bets.userId, users.id))
    .innerJoin(teams, eq(bets.pickedTeamId, teams.id))
    .where(eq(bets.matchId, matchId))
    .orderBy(desc(bets.createdAt))

  return rows.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
    pickedTeam: {
      id: r.pickedTeam.id,
      name: r.pickedTeam.name,
      fifaCode: r.pickedTeam.fifaCode,
      flagUrl:
        r.pickedTeam.flagUrl ??
        `https://flagcdn.com/w40/${r.pickedTeam.fifaCode.toLowerCase()}.png`,
    },
    stake: r.stake,
  }))
}

/** Settles a locked bet — used by scheduled jobs and lifecycle tests. */
export async function settleBet(params: {
  betId: string
  winningTeamId: string
  payoutMultiplier: number
}) {
  const db = getDb()

  return db.transaction(async (tx) => {
    const [bet] = await tx.select().from(bets).where(eq(bets.id, params.betId)).for('update')
    if (!bet) throw new BettingError('Bet not found', 404)
    if (bet.status !== 'locked') throw new BettingError('Bet is not locked')

    const won = bet.pickedTeamId === params.winningTeamId
    const payout = won ? Math.round(bet.stake * params.payoutMultiplier) : 0
    const newStatus = won ? 'won' : 'lost'

    const [settled] = await tx
      .update(bets)
      .set({ status: newStatus, settledAt: new Date() })
      .where(eq(bets.id, bet.id))
      .returning()

    const [user] = await tx.select().from(users).where(eq(users.id, bet.userId)).for('update')
    if (!user) throw new BettingError('User not found', 404)

    let coinBalance = user.coinBalance
    if (won && payout > 0) {
      const [updatedUser] = await tx
        .update(users)
        .set({
          coinBalance: user.coinBalance + payout,
          correctPredictions: user.correctPredictions + 1,
        })
        .where(eq(users.id, bet.userId))
        .returning()
      coinBalance = updatedUser.coinBalance

      await tx.insert(coinTransactions).values({
        userId: bet.userId,
        amount: payout,
        reason: 'payout',
        referenceId: bet.id,
      })
    }

    return { bet: settled, coinBalance, payout, won }
  })
}

/** Locks open bets for a matchday once betting closes. */
export async function lockMatchdayBets(matchdayDate: string) {
  const db = getDb()
  const matchRows = await db.select({ id: matches.id }).from(matches).where(eq(matches.matchdayDate, matchdayDate))
  const matchIds = matchRows.map((m) => m.id)
  if (matchIds.length === 0) return 0

  let locked = 0
  await db.transaction(async (tx) => {
    for (const matchId of matchIds) {
      const openBets = await tx
        .select()
        .from(bets)
        .where(and(eq(bets.matchId, matchId), eq(bets.status, 'open')))

      for (const bet of openBets) {
        const [match] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!match) continue
        const odds =
          bet.pickedTeamId === match.teamAId
            ? match.teamAOdds
            : match.teamBOdds

        await tx
          .update(bets)
          .set({
            status: 'locked',
            lockedAt: new Date(),
            oddsAtLock: odds,
          })
          .where(eq(bets.id, bet.id))

        const [betUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, bet.userId))
          .for('update')
        if (betUser) {
          await tx
            .update(users)
            .set({ totalPredictions: betUser.totalPredictions + 1 })
            .where(eq(users.id, bet.userId))
        }

        locked += 1
      }
    }

    await tx
      .update(matchdays)
      .set({ bettingClosed: true, lockedAt: new Date() })
      .where(eq(matchdays.matchdayDate, matchdayDate))
  })

  return locked
}

/** Locks every matchday whose first kickoff has passed. */
export async function lockDueMatchdays(): Promise<{ matchdays: number; bets: number }> {
  const db = getDb()
  const openDays = await db
    .select()
    .from(matchdays)
    .where(eq(matchdays.bettingClosed, false))

  const now = new Date()
  let matchdayCount = 0
  let betCount = 0

  for (const day of openDays) {
    if (now >= day.firstKickoffAt) {
      betCount += await lockMatchdayBets(String(day.matchdayDate))
      matchdayCount += 1
    }
  }

  return { matchdays: matchdayCount, bets: betCount }
}

/** Settles locked bets on finished matches. Idempotent — skips already-settled bets. */
export async function settleFinishedMatches(): Promise<{ settled: number; won: number; lost: number }> {
  const db = getDb()
  const finishedMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.status, 'finished'), isNotNull(matches.winnerTeamId)))

  let settled = 0
  let won = 0
  let lost = 0

  for (const match of finishedMatches) {
    if (!match.winnerTeamId) continue

    const lockedBets = await db
      .select()
      .from(bets)
      .where(and(eq(bets.matchId, match.id), eq(bets.status, 'locked')))

    for (const bet of lockedBets) {
      const result = await settleBet({
        betId: bet.id,
        winningTeamId: match.winnerTeamId,
        payoutMultiplier: Number(bet.oddsAtLock ?? 1),
      })
      settled += 1
      if (result.won) won += 1
      else lost += 1
    }
  }

  return { settled, won, lost }
}

/** Admin: record final score and settle locked bets for one match. */
export async function recordMatchResult(params: {
  matchId: string
  scoreA: number
  scoreB: number
  winnerTeamId?: string
}) {
  const db = getDb()
  const [match] = await db.select().from(matches).where(eq(matches.id, params.matchId)).limit(1)
  if (!match) throw new BettingError('Match not found', 404)

  let winnerTeamId = params.winnerTeamId ?? null
  if (!winnerTeamId) {
    if (params.scoreA > params.scoreB) winnerTeamId = match.teamAId
    else if (params.scoreB > params.scoreA) winnerTeamId = match.teamBId
    else throw new BettingError('Tied score requires winnerTeamId')
  }

  if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
    throw new BettingError('winnerTeamId must be one of the match teams')
  }

  await db
    .update(matches)
    .set({
      scoreA: params.scoreA,
      scoreB: params.scoreB,
      status: 'finished',
      winnerTeamId,
    })
    .where(eq(matches.id, params.matchId))

  const lockedBets = await db
    .select()
    .from(bets)
    .where(and(eq(bets.matchId, params.matchId), eq(bets.status, 'locked')))

  let settled = 0
  let won = 0
  let lost = 0

  for (const bet of lockedBets) {
    const result = await settleBet({
      betId: bet.id,
      winningTeamId: winnerTeamId,
      payoutMultiplier: Number(bet.oddsAtLock ?? 1),
    })
    settled += 1
    if (result.won) won += 1
    else lost += 1
  }

  return { matchId: params.matchId, winnerTeamId, settled, won, lost }
}

export type { Team }
