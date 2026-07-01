import { useEffect, useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { api } from '../lib/api'
import type { LeaderboardEntry } from '../lib/types'

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getLeaderboard()
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Leaderboard</h1>
      <p className="mb-6 text-white/65">Ranked by coin balance · Updated after daily settlement</p>
      {error && <p className="mb-4 rounded-xl bg-red-500/20 p-4 text-white">{error}</p>}
      {loading ? (
        <p className="rounded-xl bg-white/10 p-4 text-white/80">Loading leaderboard…</p>
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </>
  )
}
