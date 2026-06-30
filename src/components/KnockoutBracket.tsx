const BRACKET_LEFT = [
  [['de', 'Germany'], ['py', 'Paraguay']],
  [['fr', 'France'], ['se', 'Sweden']],
  [['za', 'South Africa'], ['ca', 'Canada']],
  [['nl', 'Netherlands'], ['ma', 'Morocco']],
  [['pt', 'Portugal'], ['hr', 'Croatia']],
  [['es', 'Spain'], ['at', 'Austria']],
  [['us', 'United States'], ['ba', 'Bosnia-Herz.']],
  [['be', 'Belgium'], ['sn', 'Senegal']],
] as const

const BRACKET_RIGHT = [
  [['br', 'Brazil'], ['jp', 'Japan']],
  [['ci', 'Ivory Coast'], ['no', 'Norway']],
  [['mx', 'Mexico'], ['ec', 'Ecuador']],
  [['gb-eng', 'England'], ['cd', 'DR Congo']],
  [['ar', 'Argentina'], ['cv', 'Cape Verde']],
  [['au', 'Australia'], ['eg', 'Egypt']],
  [['ch', 'Switzerland'], ['dz', 'Algeria']],
  [['co', 'Colombia'], ['gh', 'Ghana']],
] as const

function BracketTeam({ code, name, reverse }: { code: string; name: string; reverse?: boolean }) {
  return (
    <div className={`flex min-h-7 items-center gap-1.5 bg-gradient-to-b from-[#9ae5e3] to-[#7dd3fc] px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-wide text-slate-900 ${reverse ? 'flex-row-reverse text-right' : ''}`}>
      <img src={`https://flagcdn.com/w40/${code}.png`} alt="" className="h-3.5 w-5 shrink-0 rounded-sm object-cover" loading="lazy" />
      <span>{name}</span>
    </div>
  )
}

function BracketMatch({ teams, reverse }: { teams: readonly (readonly [string, string])[]; reverse?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.04]">
      {teams.map(([code, name]) => (
        <BracketTeam key={code} code={code} name={name} reverse={reverse} />
      ))}
    </div>
  )
}

export function KnockoutBracket() {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-gold/20 shadow-lg">
      <div className="overflow-x-auto bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
        <div className="grid min-w-[900px] grid-cols-[1fr_auto_1fr] items-center gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            {BRACKET_LEFT.map((pair, i) => (
              <BracketMatch key={i} teams={pair} />
            ))}
          </div>
          <div className="relative min-w-[160px] px-2 text-center text-white">
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-8xl font-black text-white/[0.04]">26</div>
            <div className="relative text-xl font-black tracking-wider">WORLD CUP</div>
            <div className="relative text-lg font-extrabold tracking-widest">2026</div>
            <div className="relative mt-1 text-[0.65rem] font-bold tracking-[0.22em] text-white/75">KNOCKOUT STAGE</div>
            <div className="relative mt-2 text-5xl drop-shadow-lg">🏆</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {BRACKET_RIGHT.map((pair, i) => (
              <BracketMatch key={i} teams={pair} reverse />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
