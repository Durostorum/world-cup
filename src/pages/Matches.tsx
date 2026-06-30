import { useEffect, useState } from 'react'
import { MatchCard } from '../components/MatchCard'
import { api } from '../lib/api'
import type { Match } from '../lib/types'

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    api.getMatches().then((r) => setMatches(r.matches))
  }, [])

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Matches</h1>
      <p className="mb-6 text-white/65">Sunday, 15 June 2026 · Eastern Time · Betting open until first kickoff</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {['Today', 'Group Stage', 'Knockout', 'All'].map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1.5 text-sm ${i === 0 ? 'bg-gold font-semibold text-gray-900' : 'bg-white/10 text-white'}`}
          >
            {label}
          </span>
        ))}
      </div>
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </>
  )
}
