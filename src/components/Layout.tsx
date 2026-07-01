import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { bootstrapAppUser } from '../lib/bootstrap-user'
import { api } from '../lib/api'
import { LEGAL_DISCLAIMER } from '../pages/Legal'
interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, authNotice, clearAuthNotice } = useAuth()
  const [coinBalance, setCoinBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user || import.meta.env.VITE_USE_MOCK === 'true') {
      setCoinBalance(null)
      return
    }
    bootstrapAppUser()
      .then((r) => setCoinBalance(r.user.coinBalance))
      .catch(() => setCoinBalance(null))
  }, [user])

  // Refresh balance after navigation when logged in
  useEffect(() => {
    if (!user || import.meta.env.VITE_USE_MOCK === 'true') return
    const onFocus = () => {
      api.getProfile().then((r) => setCoinBalance(r.user.coinBalance)).catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-gold-light border-b-2 border-gold pb-0.5'
      : 'text-white/85 hover:text-white'

  const displayName =
    typeof user?.userMetadata?.full_name === 'string' ? user.userMetadata.full_name : undefined
  const initials =
    displayName?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    '??'

  return (
    <>
      {authNotice && (
        <div className="flex items-center justify-between gap-3 border-b border-emerald-500/30 bg-emerald-500/15 px-6 py-2 text-sm text-emerald-100">
          <span>{authNotice}</span>
          <button type="button" onClick={clearAuthNotice} className="shrink-0 underline">
            Dismiss
          </button>
        </div>
      )}
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
          {user && (
            <span className="rounded-full border border-gold bg-gold/20 px-3 py-1.5 text-sm font-semibold text-gold-light">
              🪙 {coinBalance != null ? `${coinBalance.toLocaleString()} coins` : '…'}
            </span>
          )}
          {user ? (
            <>
              <Link
                to="/profile"
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white"
              >
                {initials}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="text-sm text-white/75 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-lg bg-gold/20 px-3 py-1.5 text-sm font-semibold text-gold-light">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-2xl px-6 pb-10 text-center text-xs text-white/50">
        <p className="mb-3 leading-relaxed">{LEGAL_DISCLAIMER}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link to="/terms" className="underline hover:text-white/70">
            Terms
          </Link>
          <Link to="/privacy" className="underline hover:text-white/70">
            Privacy
          </Link>
          <Link to="/rules" className="underline hover:text-white/70">
            Community Rules
          </Link>
          <Link to="/contact" className="underline hover:text-white/70">
            Contact
          </Link>
        </nav>
      </footer>    </>
  )
}
