import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ROUND_LABELS } from '../lib/bracket-structure'
import { bracketSlotOffset, buildKnockoutBracket, type BracketGame } from '../lib/build-bracket'
import type { Match } from '../lib/types'

const CELL_HEIGHT = 52
const CELL_GAP = 6
const UNIT = CELL_HEIGHT + CELL_GAP

function normCode(code: string) {
  return code.toLowerCase().replace('gb-eng', 'eng')
}

function codesEqual(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false
  return normCode(a) === normCode(b)
}

function flagSrc(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

function formatScore(score: number, extraScore: number | null | undefined) {
  if (extraScore != null) return `${score} (${extraScore})`
  return String(score)
}

function BettingLockIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M7 11V8a5 5 0 0 1 9.9-1" />
        <rect x="5" y="11" width="14" height="10" rx="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function BracketTeamRow({
  team,
  score,
  extraScore,
  showScore,
  isWinner,
  isLoser,
  reverse,
  placeholder,
}: {
  team: { fifaCode: string; name: string } | null
  score: number | null
  extraScore?: number | null
  showScore: boolean
  isWinner?: boolean
  isLoser?: boolean
  reverse?: boolean
  placeholder?: string
}) {
  const dimmed = isLoser
  const label = team?.name ?? placeholder ?? 'TBD'

  return (
    <div
      className={`flex min-h-[26px] items-center gap-1 px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-wide ${
        reverse ? 'flex-row-reverse text-right' : ''
      } ${team ? 'bg-gradient-to-b from-[#9ae5e3] to-[#7dd3fc] text-slate-900' : 'bg-white/10 text-white/45'} ${
        isWinner ? 'ring-2 ring-inset ring-emerald-500' : ''
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      {team ? (
        <img src={flagSrc(team.fifaCode)} alt="" className="h-3.5 w-5 shrink-0 rounded-sm object-cover" loading="lazy" />
      ) : (
        <span className="inline-block h-3.5 w-5 shrink-0 rounded-sm bg-white/20" />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {showScore && score != null && (
        <span className={`shrink-0 whitespace-nowrap tabular-nums ${isWinner ? 'font-black' : ''}`}>
          {formatScore(score, extraScore)}
        </span>
      )}
    </div>
  )
}

function BracketMatchCell({ game, reverse }: { game: BracketGame; reverse?: boolean }) {
  const finished = game.status === 'finished'
  const live = game.status === 'live'
  const showScore = finished || live
  const showBettingLock = game.bettingOpen !== null
  const bettingOpen = game.bettingOpen === true

  const content = (
    <div
      className={`min-w-[148px] overflow-hidden rounded-lg border bg-white/[0.04] ${
        live ? 'border-red-400/50' : finished ? 'border-emerald-500/30' : 'border-white/5'
      }`}
    >
      <BracketTeamRow
        team={game.teamA}
        score={game.scoreA}
        extraScore={game.extraScoreA}
        showScore={showScore}
        isWinner={finished && codesEqual(game.winnerCode, game.teamA?.fifaCode)}
        isLoser={finished && codesEqual(game.loserCode, game.teamA?.fifaCode)}
        reverse={reverse}
      />
      <div className="border-t border-slate-900/10" />
      <BracketTeamRow
        team={game.teamB}
        score={game.scoreB}
        extraScore={game.extraScoreB}
        showScore={showScore}
        isWinner={finished && codesEqual(game.winnerCode, game.teamB?.fifaCode)}
        isLoser={finished && codesEqual(game.loserCode, game.teamB?.fifaCode)}
        reverse={reverse}
        placeholder="TBD"
      />
    </div>
  )

  const matchLink = game.matchId ? (
    <Link to={`/matches/${game.matchId}`} className="block min-w-0 flex-1 transition hover:brightness-110">
      {content}
    </Link>
  ) : (
    content
  )

  return (
    <div className={`flex items-center gap-1 ${reverse ? 'flex-row-reverse' : ''}`}>
      {showBettingLock && (
        <span
          className={`flex w-4 shrink-0 items-center justify-center ${bettingOpen ? 'text-emerald-400' : 'text-amber-400/90'}`}
          title={bettingOpen ? 'Betting open' : 'Betting closed'}
          aria-label={bettingOpen ? 'Betting open' : 'Betting closed'}
        >
          <BettingLockIcon open={bettingOpen} />
        </span>
      )}
      {matchLink}
    </div>
  )
}

function BracketRoundColumn({
  label,
  games,
  roundIndex,
  reverse,
}: {
  label: string
  games: BracketGame[]
  roundIndex: number
  reverse?: boolean
}) {
  const columnHeight = UNIT * 2 ** roundIndex * Math.max(games.length, 1)

  return (
    <div className="flex w-[160px] shrink-0 flex-col">
      <p className="mb-2 text-center text-[0.55rem] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <div className="relative" style={{ height: columnHeight }}>
        {games.map((game) => (
          <div
            key={game.id}
            className="absolute left-0 right-0"
            style={{ top: bracketSlotOffset(roundIndex, game.slotIndex, UNIT) }}
          >
            <BracketMatchCell game={game} reverse={reverse} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CenterPod({ finalGame, bronzeGame }: { finalGame: BracketGame; bronzeGame: BracketGame }) {
  return (
    <div className="relative flex min-w-[150px] shrink-0 flex-col items-center justify-center px-2 py-4 text-center text-white">
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-8xl font-black text-white/[0.04]">
        26
      </div>
      <div className="relative text-lg font-black tracking-wider">WORLD CUP</div>
      <div className="relative text-base font-extrabold tracking-widest">2026</div>
      <div className="relative mt-1 text-[0.6rem] font-bold tracking-[0.2em] text-white/75">KNOCKOUT</div>
      <div className="relative mt-3 w-full">
        <p className="mb-1 text-[0.55rem] font-bold uppercase tracking-wider text-gold-light">{ROUND_LABELS.final}</p>
        <BracketMatchCell game={finalGame} />
      </div>
      <div className="relative mt-4 text-4xl drop-shadow-lg">🏆</div>
      <div className="relative mt-4 w-full">
        <p className="mb-1 text-[0.55rem] font-bold uppercase tracking-wider text-white/50">{ROUND_LABELS.bronze}</p>
        <BracketMatchCell game={bronzeGame} />
      </div>
    </div>
  )
}

export function KnockoutBracket({ matches }: { matches: Match[] }) {
  const bracket = useMemo(() => buildKnockoutBracket(matches), [matches])

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-gold/20 shadow-lg">
      <div className="overflow-x-auto bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
        <div className="flex min-w-[1100px] items-start gap-3 p-4">
          <BracketRoundColumn label={ROUND_LABELS.r32} games={bracket.left.r32} roundIndex={0} />
          <BracketRoundColumn label={ROUND_LABELS.r16} games={bracket.left.r16} roundIndex={1} />
          <BracketRoundColumn label={ROUND_LABELS.qf} games={bracket.left.qf} roundIndex={2} />
          <BracketRoundColumn label={ROUND_LABELS.sf} games={bracket.left.sf} roundIndex={3} />

          <CenterPod finalGame={bracket.final} bronzeGame={bracket.bronze} />

          <BracketRoundColumn label={ROUND_LABELS.sf} games={bracket.right.sf} roundIndex={3} reverse />
          <BracketRoundColumn label={ROUND_LABELS.qf} games={bracket.right.qf} roundIndex={2} reverse />
          <BracketRoundColumn label={ROUND_LABELS.r16} games={bracket.right.r16} roundIndex={1} reverse />
          <BracketRoundColumn label={ROUND_LABELS.r32} games={bracket.right.r32} roundIndex={0} reverse />
        </div>
      </div>
    </section>
  )
}
