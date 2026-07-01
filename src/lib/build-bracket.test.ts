import { describe, expect, it } from 'vitest'
import { buildKnockoutBracket } from './build-bracket'
import type { Match } from './types'

function finishedMatch(
  fifaMatchNumber: number,
  teamA: { id: string; fifaCode: string; name: string },
  teamB: { id: string; fifaCode: string; name: string },
  scoreA: number,
  scoreB: number,
  winnerId: string,
): Match {
  return {
    id: `m-${fifaMatchNumber}`,
    fifaMatchNumber,
    stage: 'round_of_32',
    groupCode: null,
    teamA: { ...teamA, flagUrl: '' },
    teamB: { ...teamB, flagUrl: '' },
    kickoffAt: '2026-06-29T12:00:00Z',
    matchdayDate: '2026-06-29',
    venue: 'Test',
    city: 'Test',
    status: 'finished',
    teamAOdds: 1.5,
    teamBOdds: 2.5,
    scoreA,
    scoreB,
    winnerTeamId: winnerId,
    bettingOpen: false,
    bettingClosesAt: '2026-06-29T12:00:00Z',
  }
}

describe('buildKnockoutBracket', () => {
  it('feeds R32 winners into the correct R16 pairings on the left', () => {
    const matches = [
      finishedMatch(
        75,
        { id: 'de', fifaCode: 'de', name: 'Germany' },
        { id: 'py', fifaCode: 'py', name: 'Paraguay' },
        1,
        1,
        'py',
      ),
      finishedMatch(
        73,
        { id: 'za', fifaCode: 'za', name: 'South Africa' },
        { id: 'ca', fifaCode: 'ca', name: 'Canada' },
        0,
        1,
        'ca',
      ),
      finishedMatch(
        76,
        { id: 'nl', fifaCode: 'nl', name: 'Netherlands' },
        { id: 'ma', fifaCode: 'ma', name: 'Morocco' },
        1,
        1,
        'ma',
      ),
    ]

    const bracket = buildKnockoutBracket(matches)
    expect(bracket.left.r32[0].winnerCode).toBe('py')
    expect(bracket.left.r16[0].teamA?.fifaCode).toBe('py')
    expect(bracket.left.r16[0].teamB).toBeNull()
    expect(bracket.left.r16[1].teamA?.fifaCode).toBe('ca')
    expect(bracket.left.r16[1].teamB?.fifaCode).toBe('ma')
  })

  it('shows scores on finished R32 games', () => {
    const matches = [
      finishedMatch(
        74,
        { id: 'br', fifaCode: 'br', name: 'Brazil' },
        { id: 'jp', fifaCode: 'jp', name: 'Japan' },
        2,
        1,
        'br',
      ),
    ]

    const bracket = buildKnockoutBracket(matches)
    expect(bracket.right.r32[0].scoreA).toBe(2)
    expect(bracket.right.r32[0].scoreB).toBe(1)
    expect(bracket.right.r32[0].winnerCode).toBe('br')
  })

  it('uses seed fallback scores when API data is missing', () => {
    const bracket = buildKnockoutBracket([])
    const gerPar = bracket.left.r32[0]
    expect(gerPar.scoreA).toBe(1)
    expect(gerPar.scoreB).toBe(1)
    expect(gerPar.status).toBe('finished')
    expect(gerPar.winnerCode).toBe('py')
    expect(gerPar.extraScoreA).toBe(3)
    expect(gerPar.extraScoreB).toBe(4)
  })

  it('notes penalty wins on drawn knockout games', () => {
    const bracket = buildKnockoutBracket([])
    expect(bracket.left.r32[3].extraScoreA).toBe(2)
    expect(bracket.left.r32[3].extraScoreB).toBe(3)
  })
})
