import type { LeaderboardEntry } from '../lib/types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

function rowClass(entry: LeaderboardEntry): string {
  if (entry.rank === 1) return 'bg-blue-900/25'
  if (entry.rank === 2) return 'bg-blue-500/15'
  if (entry.rank === 3) return 'bg-blue-300/20'
  if (entry.isCurrentUser) return 'bg-blue-500/10 shadow-[inset_3px_0_0_#3b82f6]'
  const total = 12
  if (entry.rank >= total - 2) return 'bg-red-800/20'
  if (entry.rank === total - 2) return 'bg-red-500/15'
  if (entry.rank === total - 1) return 'bg-red-400/10'
  return ''
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const maxRank = Math.max(...entries.map((e) => e.rank), 12)

  const getBottomClass = (rank: number) => {
    if (rank === maxRank) return 'bg-red-800/20'
    if (rank === maxRank - 1) return 'bg-red-500/15'
    if (rank === maxRank - 2) return 'bg-red-400/10'
    return ''
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 text-right">Coins</th>
            <th className="px-4 py-3 text-right">Correct %</th>
            <th className="px-4 py-3 text-right">Bets</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const podium = entry.rank <= 3 ? rowClass(entry) : ''
            const bottom = entry.rank > 3 ? getBottomClass(entry.rank) : ''
            const you = entry.isCurrentUser ? 'shadow-[inset_3px_0_0_#3b82f6]' : ''
            return (
              <tr key={entry.userId} className={`border-b border-gray-100 ${podium || bottom} ${you}`}>
                <td className={`px-4 py-3 font-bold ${entry.rank <= 3 ? 'text-blue-700' : 'text-gray-500'}`}>
                  {entry.rank}
                </td>
                <td className="px-4 py-3 font-medium">
                  {entry.displayName}
                  {entry.isCurrentUser && ' (you)'}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums">{entry.coinBalance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{entry.accuracyPct}%</td>
                <td className="px-4 py-3 text-right tabular-nums">{entry.totalBets}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Sorted by coin balance (desc). Dark-to-light blue = top 3. Light-to-dark red = bottom 3.
      </p>
    </div>
  )
}
