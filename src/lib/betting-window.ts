import { format } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

export const BETTING_TIMEZONE = 'America/New_York'

export function getMatchdayDate(kickoffAt: Date | string): string {
  const date = typeof kickoffAt === 'string' ? new Date(kickoffAt) : kickoffAt
  return format(toZonedTime(date, BETTING_TIMEZONE), 'yyyy-MM-dd')
}

export function bettingOpensAt(matchdayDate: string): Date {
  return fromZonedTime(`${matchdayDate}T00:00:00`, BETTING_TIMEZONE)
}

export function isBettingOpen(
  matchday: { matchdayDate: string; firstKickoffAt: string | Date; bettingClosed: boolean },
  now = new Date(),
): boolean {
  if (matchday.bettingClosed) return false
  if (now < bettingOpensAt(matchday.matchdayDate)) return false
  const firstKickoff =
    typeof matchday.firstKickoffAt === 'string'
      ? new Date(matchday.firstKickoffAt)
      : matchday.firstKickoffAt
  if (now >= firstKickoff) return false
  return true
}
