import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { BETTING_TIMEZONE } from './betting-window'
import type { Match } from './types'

export function todayMatchdayDate(now = new Date()): string {
  return format(toZonedTime(now, BETTING_TIMEZONE), 'yyyy-MM-dd')
}

export function formatMatchdayHeading(matchdayDate: string): string {
  const date = new Date(`${matchdayDate}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: BETTING_TIMEZONE,
  })
}

export function matchStageLabel(match: Match): string {
  if (match.stage === 'round_of_32') return 'Round of 32'
  if (match.stage === 'round_of_16') return 'Round of 16'
  if (match.stage === 'quarter_final') return 'Quarter-final'
  if (match.stage === 'semi_final') return 'Semi-final'
  if (match.groupCode) return `Group ${match.groupCode}`
  return match.stage.replace(/_/g, ' ')
}

export function sortByKickoff(a: Match, b: Match): number {
  return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
}

export function filterMatchesByMatchday(matches: Match[], matchdayDate: string): Match[] {
  return matches.filter((m) => String(m.matchdayDate).slice(0, 10) === matchdayDate)
}

function uniqueMatchdays(matches: Match[]): string[] {
  return [...new Set(matches.map((m) => String(m.matchdayDate).slice(0, 10)))].sort()
}

/** Calendar today in ET, or the next/upcoming matchday when today has no fixtures. */
export function resolveMatchdayDate(matches: Match[], now = new Date()): string {
  const today = todayMatchdayDate(now)
  if (filterMatchesByMatchday(matches, today).length > 0) return today

  const upcoming = uniqueMatchdays(matches).filter((d) => d >= today)
  for (const day of upcoming) {
    const dayMatches = filterMatchesByMatchday(matches, day)
    if (dayMatches.some((m) => m.status === 'scheduled' || m.status === 'live')) return day
  }

  const past = uniqueMatchdays(matches).filter((d) => d <= today)
  return past.at(-1) ?? today
}

export function isShowingUpcomingMatchday(matches: Match[], now = new Date()): boolean {
  return resolveMatchdayDate(matches, now) !== todayMatchdayDate(now)
}
