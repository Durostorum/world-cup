import { Link, NavLink } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
  coinBalance?: number
}

export function Layout({ children, coinBalance = 8450 }: LayoutProps) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-gold-light border-b-2 border-gold pb-0.5'
      : 'text-white/85 hover:text-white'

  return (
    <>
      <nav className="flex items-center justify-between border-b border-gold/25 bg-white/5 px-6 py-4 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-light text-base">
            ⚽
          </span>
          {import.meta.env.VITE_APP_NAME ?? 'World Cup Pool 2026'}
        </Link>
        <ul className="flex list-none gap-6 text-sm font-medium">
          <li><NavLink to="/" className={navClass} end>Home</NavLink></li>
          <li><NavLink to="/matches" className={navClass}>Matches</NavLink></li>
          <li><NavLink to="/my-bets" className={navClass}>My Bets</NavLink></li>
          <li><NavLink to="/leaderboard" className={navClass}>Leaderboard</NavLink></li>
        </ul>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-gold bg-gold/20 px-3 py-1.5 text-sm font-semibold text-gold-light">
            🪙 {coinBalance.toLocaleString()} coins
          </span>
          <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
            GK
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <p className="mx-auto max-w-xl px-6 pb-8 text-center text-xs text-white/45">
        Fictional coins only — no real money. For entertainment purposes.
      </p>
    </>
  )
}
