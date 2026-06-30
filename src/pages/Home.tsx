import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KnockoutBracket } from '../components/KnockoutBracket'
import { MatchCard } from '../components/MatchCard'
import { api } from '../lib/api'
import type { Match } from '../lib/types'

export function HomePage() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    api.getMatches().then((r) => setMatches(r.matches.slice(0, 2)))
  }, [])

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-gold/30 bg-white/95 p-8 shadow-lg">
        <div className="pointer-events-none absolute -right-2 -top-4 text-9xl font-black text-pitch/5">2026</div>
        <h1 className="relative text-3xl font-bold text-pitch">Predict. Stake. Climb the board.</h1>
        <p className="relative mt-2 max-w-lg text-gray-600">
          Fictional coin predictions for FIFA World Cup 2026. Pick winners, bet before the first kickoff each day, and compete with friends.
        </p>
        <div className="relative mt-5 flex gap-3">
          <Link to="/matches" className="rounded-lg bg-pitch px-5 py-2.5 text-sm font-semibold text-white">Today&apos;s Matches</Link>
          <Link to="/leaderboard" className="rounded-lg border-2 border-pitch px-5 py-2.5 text-sm font-semibold text-pitch">View Standings</Link>
        </div>
      </section>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-light">Knockout stage · Round of 32</p>
      <KnockoutBracket />

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-light">Upcoming today · Betting closes at first kickoff ET</p>
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </>
  )
}
