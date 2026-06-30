import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { TeamFlag } from '../components/TeamFlag'
import { api } from '../lib/api'
import { calculatePayout } from '../lib/odds'
import type { BetHistoryEntry, Match } from '../lib/types'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [history, setHistory] = useState<BetHistoryEntry[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>()
  const [stake, setStake] = useState(500)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) return
    api.getMatch(id).then((r) => {
      setMatch(r.match)
      setHistory(r.betHistory)
    })
  }, [id])

  if (!match) return <p className="text-white">Loading…</p>

  const odds =
    selectedTeamId === match.teamA.id
      ? match.teamAOdds
      : selectedTeamId === match.teamB.id
        ? match.teamBOdds
        : null

  const usaTotal = history.filter((h) => h.pickedTeam.id === match.teamA.id).reduce((s, h) => s + h.stake, 0)
  const pyTotal = history.filter((h) => h.pickedTeam.id === match.teamB.id).reduce((s, h) => s + h.stake, 0)

  async function confirmBet() {
    if (!selectedTeamId || !id) return
    try {
      await api.placeBet({ matchId: id, pickedTeamId: selectedTeamId, stake })
      setMessage('Bet confirmed!')
      const r = await api.getMatch(id)
      setHistory(r.betHistory)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Bet failed')
    }
  }

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Group {match.groupCode} · Match {match.fifaMatchNumber}</h1>
      <p className="mb-6 text-white/65">{match.venue}, {match.city}</p>

      <MatchCard
        match={match}
        compact
        selectedTeamId={selectedTeamId}
        onSelectTeam={match.bettingOpen ? setSelectedTeamId : undefined}
      />

      {match.bettingOpen && selectedTeamId && odds && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg">
          <label className="mb-2 block text-sm text-gray-600">
            Stake: <strong>{stake}</strong> coins
          </label>
          <input type="range" min={1} max={8450} value={stake} onChange={(e) => setStake(Number(e.target.value))} className="w-full accent-pitch" />
          <p className="mt-2 text-sm font-semibold text-emerald-600">
            Potential return: {calculatePayout(stake, odds)} coins
          </p>
          <button type="button" onClick={confirmBet} className="mt-4 w-full rounded-lg bg-pitch py-3 font-semibold text-white">
            Confirm stake
          </button>
          {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <strong>Bets history</strong>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{history.length} bets · open</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            <TeamFlag fifaCode={match.teamA.fifaCode} name={`${usaTotal.toLocaleString()} coins`} /> ({history.filter((h) => h.pickedTeam.id === match.teamA.id).length} players) ·{' '}
            <TeamFlag fifaCode={match.teamB.fifaCode} name={`${pyTotal.toLocaleString()} coins`} /> ({history.filter((h) => h.pickedTeam.id === match.teamB.id).length} players)
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Pick</th>
              <th className="px-4 py-3 text-right">Stake</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.userId} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{h.displayName}</td>
                <td className="px-4 py-3"><TeamFlag fifaCode={h.pickedTeam.fifaCode} name={h.pickedTeam.name} /></td>
                <td className="px-4 py-3 text-right font-bold">{h.stake.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
