import { Link } from 'react-router-dom'
import type { Match } from '../lib/types'
import { oddsToImpliedPercent } from '../lib/odds'
import { TeamFlag, TeamFlagOnly } from './TeamFlag'

interface MatchCardProps {
  match: Match
  compact?: boolean
  selectedTeamId?: string
  onSelectTeam?: (teamId: string) => void
}

export function MatchCard({ match, compact, selectedTeamId, onSelectTeam }: MatchCardProps) {
  const kickoff = new Date(match.kickoffAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg shadow-pitch/10">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
        <span>
          <strong className="text-pitch">Group {match.groupCode}</strong> · Match {match.fifaMatchNumber} · {kickoff}
        </span>
        {!compact && <span>{match.venue}</span>}
        {match.bettingOpen ? (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Open</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Locked</span>
        )}
      </div>
      {!compact && match.bettingOpen && (
        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          ⏱ Betting closes at first kickoff today (Eastern)
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {([match.teamA, match.teamB] as const).map((team, i) => {
          const odds = i === 0 ? match.teamAOdds : match.teamBOdds
          const selected = selectedTeamId === team.id
          const cell = (
            <button
              key={team.id}
              type="button"
              disabled={!match.bettingOpen || !onSelectTeam}
              onClick={() => onSelectTeam?.(team.id)}
              className={`rounded-xl border-2 p-4 text-center transition ${selected ? 'border-pitch bg-pitch/5' : 'border-gray-200'} ${onSelectTeam ? 'cursor-pointer hover:border-pitch/50' : 'cursor-default'}`}
            >
              <div className="mb-2 flex justify-center">
                <TeamFlagOnly fifaCode={team.fifaCode} />
              </div>
              <div className="mb-2 font-bold">{team.name}</div>
              {odds != null && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-pitch px-3 py-1 text-sm font-semibold text-white">
                    👍 {odds.toFixed(2)}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">{oddsToImpliedPercent(odds)}% implied</div>
                </>
              )}
            </button>
          )
          return i === 0 ? [cell, <span key="vs" className="font-extrabold text-gray-400">VS</span>] : [cell]
        }).flat()}
      </div>
      {!compact && (
        <div className="mt-3 text-right">
          <Link to={`/matches/${match.id}`} className="text-sm font-semibold text-pitch hover:underline">
            View match →
          </Link>
        </div>
      )}
    </div>
  )
}

export function MatchTeamsLine({ teamA, teamB }: { teamA: Match['teamA']; teamB: Match['teamB'] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <TeamFlag fifaCode={teamA.fifaCode} name={teamA.name} />
      <span className="text-sm font-bold text-gray-400">vs</span>
      <TeamFlag fifaCode={teamB.fifaCode} name={teamB.name} />
    </span>
  )
}
