import { useMemo, useState } from 'react'
import { MatchCard } from '../components/MatchCard'
import { filterMatchesByMatchday, formatMatchdayHeading, isShowingUpcomingMatchday, resolveMatchdayDate } from '../lib/match-utils'
import { useMatches } from '../lib/use-matches'

type Filter = 'today' | 'group' | 'knockout' | 'all'

export function MatchesPage() {
  const { matches, error } = useMatches()
  const [filter, setFilter] = useState<Filter>('today')
  const matchday = resolveMatchdayDate(matches)
  const showingUpcoming = isShowingUpcomingMatchday(matches)

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today':
        return filterMatchesByMatchday(matches, matchday)
      case 'group':
        return matches.filter((m) => m.stage.startsWith('group'))
      case 'knockout':
        return matches.filter((m) => m.stage.startsWith('round_of') || m.stage.includes('final'))
      default:
        return matches
    }
  }, [filter, matches, matchday])

  const bettingOpenToday = filter === 'today' && filtered.some((m) => m.bettingOpen)

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Matches</h1>
      <p className="mb-6 text-white/65">
        {showingUpcoming && filter === 'today' ? 'Next matchday · ' : ''}
        {formatMatchdayHeading(matchday)} · Eastern Time ·{' '}
        {filter === 'today'
          ? bettingOpenToday
            ? 'Betting open until first kickoff'
            : 'Betting closed for today'
          : 'All tournament fixtures'}
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['today', 'Today'],
            ['group', 'Group Stage'],
            ['knockout', 'Knockout'],
            ['all', 'All'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === key ? 'bg-gold font-semibold text-gray-900' : 'bg-white/10 text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 rounded-xl bg-amber-500/20 p-4 text-white">{error}</p>}
      {filtered.length === 0 && !error && (
        <p className="rounded-xl bg-white/10 p-4 text-white/80">No matches for this filter.</p>
      )}
      {filtered.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </>
  )
}
