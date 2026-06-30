import { describe, expect, it } from 'vitest'
import { bettingOpensAt, getMatchdayDate, isBettingOpen } from './betting-window'

describe('betting-window', () => {
  it('groups matchday by Eastern calendar date', () => {
    expect(getMatchdayDate('2026-06-15T14:00:00-04:00')).toBe('2026-06-15')
  })

  it('opens at midnight Eastern', () => {
    const opens = bettingOpensAt('2026-06-15')
    expect(opens.toISOString()).toBe('2026-06-15T04:00:00.000Z')
  })

  it('closes at first kickoff', () => {
    const md = {
      matchdayDate: '2026-06-15',
      firstKickoffAt: '2026-06-15T14:00:00-04:00',
      bettingClosed: false,
    }
    expect(isBettingOpen(md, new Date('2026-06-15T08:00:00-04:00'))).toBe(true)
    expect(isBettingOpen(md, new Date('2026-06-15T14:00:00-04:00'))).toBe(false)
  })
})
