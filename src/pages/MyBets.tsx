import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TeamFlag } from '../components/TeamFlag'
import { api } from '../lib/api'
import type { Bet } from '../lib/types'

const statusClass: Record<Bet['status'], string> = {
  open: 'bg-blue-100 text-blue-800',
  locked: 'bg-amber-100 text-amber-900',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
}

export function MyBetsPage() {
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    api.getBets().then((r) => setBets(r.bets))
  }, [])

  const grouped = {
    open: bets.filter((b) => b.status === 'open'),
    locked: bets.filter((b) => b.status === 'locked'),
    settled: bets.filter((b) => b.status === 'won' || b.status === 'lost'),
  }

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">My Bets</h1>
      <p className="mb-6 text-white/65">Open bets can be increased until today&apos;s first kickoff (ET)</p>

      {(['open', 'locked', 'settled'] as const).map((key) => (
        grouped[key].length > 0 && (
          <div key={key}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-light">{key}</p>
            {grouped[key].map((bet) => (
              <div key={bet.id} className="mb-3 flex items-center justify-between rounded-2xl bg-white p-4 shadow">
                <div>
                  <Link to={`/matches/${bet.matchId}`} className="font-semibold hover:underline">
                    <TeamFlag fifaCode={bet.pickedTeam.fifaCode} name={bet.pickedTeam.name} />
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    {bet.stake} coins {bet.oddsAtLock ? `@ ${bet.oddsAtLock}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusClass[bet.status]}`}>
                  {bet.status}
                </span>
              </div>
            ))}
          </div>
        )
      ))}
    </>
  )
}
