import { describe, expect, it } from 'vitest'
import { calculatePayout, oddsToImpliedPercent, probabilityToDecimalOdds } from './odds'

describe('odds', () => {
  it('converts probability to decimal odds', () => {
    expect(probabilityToDecimalOdds(0.5)).toBe(2)
  })

  it('calculates implied percent', () => {
    expect(oddsToImpliedPercent(2)).toBe(50)
  })

  it('calculates payout', () => {
    expect(calculatePayout(500, 1.45)).toBe(725)
  })
})
