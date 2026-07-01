import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { TeamFlag } from '../components/TeamFlag'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { matchStageLabel } from '../lib/match-utils'
import { calculatePayout } from '../lib/odds'
import type { BetHistoryEntry, Match } from '../lib/types'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [history, setHistory] = useState<BetHistoryEntry[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>()
  const [stake, setStake] = useState(500)
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) return
    api.getMatch(id).then((r) => {
      setMatch(r.match)
      setHistory(r.betHistory)
    })
    api.getProfile().then((r) => setCoinBalance(r.user.coinBalance)).catch(() => setCoinBalance(null))
  }, [id, user])

  if (!match) return <p className="text-white">Loading…</p>

  const odds =
    selectedTeamId === match.teamA.id
      ? match.teamAOdds
      : selectedTeamId === match.teamB.id
        ? match.teamBOdds
        : null

  const teamATotal = history.filter((h) => h.pickedTeam.id === match.teamA.id).reduce((s, h) => s + h.stake, 0)
  const teamBTotal = history.filter((h) => h.pickedTeam.id === match.teamB.id).reduce((s, h) => s + h.stake, 0)
  const maxStake = coinBalance ?? 10_000

  async function confirmBet() {
    if (!selectedTeamId || !id) return
    setMessage('')
    try {
      const result = await api.placeBet({ matchId: id, pickedTeamId: selectedTeamId, stake })
      setCoinBalance(result.coinBalance)
      setMessage('Bet confirmed!')
      const r = await api.getMatch(id)
      setHistory(r.betHistory)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Bet failed')
    }
  }

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">
        {matchStageLabel(match)} · Match {match.fifaMatchNumber}
      </h1>
      <p className="mb-6 text-white/65">{match.venue}, {match.city}</p>

      <MatchCard
        match={match}
        compact
        selectedTeamId={selectedTeamId}
        onSelectTeam={match.bettingOpen ? setSelectedTeamId : undefined}
      />

      {match.bettingOpen && !user && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm text-gray-600">Sign in to place a bet on this match.</p>
          <Link to="/auth" className="mt-3 inline-block rounded-lg bg-pitch px-4 py-2 text-sm font-semibold text-white">
            Sign in or create account
          </Link>
        </div>
      )}

      {match.bettingOpen && user && selectedTeamId && odds && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg">
          {coinBalance != null && (
            <p className="mb-3 text-sm text-gray-600">
              Your balance: <strong>{coinBalance.toLocaleString()}</strong> coins
            </p>
          )}
          <label className="mb-2 block text-sm text-gray-600">
            Stake: <strong>{stake}</strong> coins
          </label>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxStake)}
            value={Math.min(stake, maxStake)}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full accent-pitch"
          />
          <p className="mt-2 text-sm font-semibold text-emerald-600">
            Potential return: {calculatePayout(stake, odds)} coins
          </p>
          <button type="button" onClick={confirmBet} className="mt-4 w-full rounded-lg bg-pitch py-3 font-semibold text-white">
            Confirm stake
          </button>
          {message && (
            <p className={`mt-2 text-sm ${message === 'Bet confirmed!' ? 'text-emerald-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <strong>Bets history</strong>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
              {history.length} bets · {match.bettingOpen ? 'open' : 'closed'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            <TeamFlag fifaCode={match.teamA.fifaCode} name={`${teamATotal.toLocaleString()} coins`} /> ({history.filter((h) => h.pickedTeam.id === match.teamA.id).length} players) ·{' '}
            <TeamFlag fifaCode={match.teamB.fifaCode} name={`${teamBTotal.toLocaleString()} coins`} /> ({history.filter((h) => h.pickedTeam.id === match.teamB.id).length} players)
          </p>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No bets placed yet.</p>
        ) : (
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
                <tr key={`${h.userId}-${h.pickedTeam.id}`} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{h.displayName}</td>
                  <td className="px-4 py-3"><TeamFlag fifaCode={h.pickedTeam.fifaCode} name={h.pickedTeam.name} /></td>
                  <td className="px-4 py-3 text-right font-bold">{h.stake.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
