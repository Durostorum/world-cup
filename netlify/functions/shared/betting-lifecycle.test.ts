import { describe, expect, it } from 'vitest'
import { isBettingOpen } from '../../../src/lib/betting-window.js'
import { BettingError } from './betting.js'

type BetStatus = 'open' | 'locked' | 'won' | 'lost'

interface MemoryUser {
  id: string
  coinBalance: number
  totalPredictions: number
  correctPredictions: number
}

interface MemoryBet {
  id: string
  userId: string
  matchId: string
  pickedTeamId: string
  stake: number
  status: BetStatus
  oddsAtLock: number | null
}

interface MemoryMatch {
  id: string
  teamAId: string
  teamBId: string
  teamAOdds: number
  teamBOdds: number
  status: 'scheduled' | 'live' | 'finished'
  matchdayDate: string
  firstKickoffAt: string
  bettingClosed: boolean
}

class InMemoryBettingStore {
  users = new Map<string, MemoryUser>()
  bets = new Map<string, MemoryBet>()
  matches = new Map<string, MemoryMatch>()
  /** Fixed "now" for deterministic betting-window tests */
  readonly now: Date

  constructor(now = new Date('2099-06-15T10:00:00-04:00')) {
    this.now = now
    this.users.set('u1', {
      id: 'u1',
      coinBalance: 10_000,
      totalPredictions: 0,
      correctPredictions: 0,
    })
    this.matches.set('m1', {
      id: 'm1',
      teamAId: 't-a',
      teamBId: 't-b',
      teamAOdds: 1.5,
      teamBOdds: 2.5,
      status: 'scheduled',
      matchdayDate: '2099-06-15',
      firstKickoffAt: '2099-06-15T18:00:00-04:00',
      bettingClosed: false,
    })
  }

  private betKey(userId: string, matchId: string) {
    return `${userId}:${matchId}`
  }

  placeBet(input: { userId: string; matchId: string; pickedTeamId: string; stake: number }) {
    const user = this.users.get(input.userId)
    if (!user) throw new BettingError('User not found', 404)

    const match = this.matches.get(input.matchId)
    if (!match) throw new BettingError('Match not found', 404)
    if (match.status !== 'scheduled') throw new BettingError('Match is not open for betting')

    if (
      !isBettingOpen(
        {
          matchdayDate: match.matchdayDate,
          firstKickoffAt: match.firstKickoffAt,
          bettingClosed: match.bettingClosed,
        },
        this.now,
      )
    ) {
      throw new BettingError('Betting is closed for this matchday')
    }

    if (input.pickedTeamId !== match.teamAId && input.pickedTeamId !== match.teamBId) {
      throw new BettingError('Invalid team selection')
    }

    const key = this.betKey(input.userId, input.matchId)
    const existing = this.bets.get(key)

    if (existing && existing.pickedTeamId !== input.pickedTeamId) {
      throw new BettingError('Cannot switch team after placing a bet')
    }
    if (existing && existing.status !== 'open') {
      throw new BettingError('Bet is locked and cannot be changed')
    }

    const delta = existing ? input.stake - existing.stake : input.stake
    if (existing && delta <= 0) throw new BettingError('Stake can only be increased')
    if (delta > user.coinBalance) throw new BettingError('Insufficient coin balance')

    user.coinBalance -= delta

    if (existing) {
      existing.stake = input.stake
      return { bet: existing, coinBalance: user.coinBalance, created: false }
    }

    const bet: MemoryBet = {
      id: `b-${this.bets.size + 1}`,
      userId: input.userId,
      matchId: input.matchId,
      pickedTeamId: input.pickedTeamId,
      stake: input.stake,
      status: 'open',
      oddsAtLock: null,
    }
    this.bets.set(key, bet)
    return { bet, coinBalance: user.coinBalance, created: true }
  }

  lockMatchday() {
    for (const bet of this.bets.values()) {
      if (bet.status !== 'open') continue
      const match = this.matches.get(bet.matchId)
      if (!match) continue
      bet.status = 'locked'
      bet.oddsAtLock = bet.pickedTeamId === match.teamAId ? match.teamAOdds : match.teamBOdds
      const user = this.users.get(bet.userId)!
      user.totalPredictions += 1
    }
    const match = this.matches.get('m1')!
    match.bettingClosed = true
  }

  settleBet(betId: string, winningTeamId: string) {
    const bet = [...this.bets.values()].find((b) => b.id === betId)
    if (!bet) throw new BettingError('Bet not found', 404)
    if (bet.status !== 'locked') throw new BettingError('Bet is not locked')

    const user = this.users.get(bet.userId)!
    const won = bet.pickedTeamId === winningTeamId
    bet.status = won ? 'won' : 'lost'

    if (won) {
      const payout = Math.round(bet.stake * (bet.oddsAtLock ?? 1))
      user.coinBalance += payout
      user.correctPredictions += 1
      return { payout, coinBalance: user.coinBalance, won }
    }

    return { payout: 0, coinBalance: user.coinBalance, won }
  }
}

describe('betting lifecycle', () => {
  it('places an open bet and debits balance', () => {
    const store = new InMemoryBettingStore()
    const result = store.placeBet({
      userId: 'u1',
      matchId: 'm1',
      pickedTeamId: 't-a',
      stake: 500,
    })
    expect(result.created).toBe(true)
    expect(result.coinBalance).toBe(9500)
    expect(result.bet.status).toBe('open')
  })

  it('allows increasing stake on the same pick', () => {
    const store = new InMemoryBettingStore()
    store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 500 })
    const result = store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 800 })
    expect(result.created).toBe(false)
    expect(result.bet.stake).toBe(800)
    expect(result.coinBalance).toBe(9200)
  })

  it('rejects switching team after initial bet', () => {
    const store = new InMemoryBettingStore()
    store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 500 })
    expect(() =>
      store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-b', stake: 600 }),
    ).toThrow('Cannot switch team after placing a bet')
  })

  it('rejects bets when balance is insufficient', () => {
    const store = new InMemoryBettingStore()
    expect(() =>
      store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 20_000 }),
    ).toThrow('Insufficient coin balance')
  })

  it('rejects changes after matchday lock', () => {
    const store = new InMemoryBettingStore()
    store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 500 })
    store.lockMatchday()
    expect(() =>
      store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 900 }),
    ).toThrow('Betting is closed for this matchday')
  })

  it('pays out winning locked bets on settlement', () => {
    const store = new InMemoryBettingStore()
    const { bet } = store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 500 })
    store.lockMatchday()
    const result = store.settleBet(bet.id, 't-a')
    expect(result.won).toBe(true)
    expect(result.payout).toBe(750)
    expect(result.coinBalance).toBe(10250)
  })

  it('does not refund stake on losing bets', () => {
    const store = new InMemoryBettingStore()
    const { bet } = store.placeBet({ userId: 'u1', matchId: 'm1', pickedTeamId: 't-a', stake: 500 })
    store.lockMatchday()
    const result = store.settleBet(bet.id, 't-b')
    expect(result.won).toBe(false)
    expect(result.payout).toBe(0)
    expect(result.coinBalance).toBe(9500)
  })
})
