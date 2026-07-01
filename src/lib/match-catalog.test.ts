import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  filterMatchesByMatchday,
  resolveMatchdayDate,
  todayMatchdayDate,
} from './match-utils'
import { mergeWithFixtureCatalog } from './match-catalog'

describe('match-catalog', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes July 1 fixtures when the API returns nothing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T10:00:00-04:00'))

    const merged = mergeWithFixtureCatalog([])
    const today = merged.filter((m) => m.matchdayDate === '2026-07-01')
    expect(today).toHaveLength(3)
    expect(today.map((m) => m.fifaMatchNumber).sort()).toEqual([82, 84, 87])
  })

  it('prefers API matches over catalog entries', () => {
    const merged = mergeWithFixtureCatalog([
      {
        id: 'api-id',
        fifaMatchNumber: 84,
        stage: 'round_of_32',
        groupCode: null,
        teamA: { id: 'a', name: 'England', fifaCode: 'gb-eng', flagUrl: '' },
        teamB: { id: 'b', name: 'DR Congo', fifaCode: 'cd', flagUrl: '' },
        kickoffAt: '2026-07-01T16:00:00Z',
        matchdayDate: '2026-07-01',
        venue: 'Stadium',
        city: 'City',
        status: 'scheduled',
        teamAOdds: 2,
        teamBOdds: 1.8,
        scoreA: null,
        scoreB: null,
        winnerTeamId: null,
        bettingOpen: true,
        bettingClosesAt: '2026-07-01T16:00:00Z',
      },
    ])
    expect(merged.find((m) => m.fifaMatchNumber === 84)?.id).toBe('api-id')
  })
})

describe('filterMatchesByMatchday', () => {
  it('normalizes matchday dates', () => {
    const matches = mergeWithFixtureCatalog([])
    expect(filterMatchesByMatchday(matches, '2026-07-01')).toHaveLength(3)
  })
})

describe('resolveMatchdayDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns calendar today when fixtures exist', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T10:00:00-04:00'))
    const matches = mergeWithFixtureCatalog([])
    expect(resolveMatchdayDate(matches)).toBe('2026-07-01')
    expect(todayMatchdayDate()).toBe('2026-07-01')
  })

  it('falls forward to the next matchday when today is empty', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-04T10:00:00-04:00'))
    const matches = mergeWithFixtureCatalog([])
    expect(resolveMatchdayDate(matches)).toBe('2026-07-03')
  })
})
