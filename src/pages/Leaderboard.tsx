import { useEffect, useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { api } from '../lib/api'
import type { LeaderboardEntry } from '../lib/types'

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    api.getLeaderboard().then((r) => setEntries(r.entries))
  }, [])

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Leaderboard</h1>
      <p className="mb-6 text-white/65">Ranked by coin balance · Updated after daily settlement</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {['All time', 'Group stage', 'Knockout'].map((label, i) => (
          <span key={label} className={`rounded-full px-3 py-1.5 text-sm ${i === 0 ? 'bg-gold font-semibold text-gray-900' : 'bg-white/10 text-white'}`}>
            {label}
          </span>
        ))}
      </div>
      <LeaderboardTable entries={entries} />
    </>
  )
}
