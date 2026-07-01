import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { bootstrapAppUser } from '../lib/bootstrap-user'
import type { UserProfile } from '../lib/types'

export function ProfilePage() {
  const { user: identityUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!identityUser) {
      setUser(null)
      setError('')
      return
    }

    let cancelled = false
    setError('')
    setUser(null)

    bootstrapAppUser()
      .then((r) => {
        if (!cancelled) setUser(r.user)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile')
      })

    return () => {
      cancelled = true
    }
  }, [identityUser?.id, authLoading])

  if (authLoading || (identityUser && !user && !error)) {
    return <p className="text-white">Loading…</p>
  }

  if (!identityUser) {
    return (
      <>
        <h1 className="mb-1 text-3xl font-bold text-white">Profile</h1>
        <p className="mb-4 text-white/70">Sign in to view your coin balance, stats, and account details.</p>
        <Link
          to="/auth"
          className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-gray-900"
        >
          Sign in
        </Link>
      </>
    )
  }

  if (error) {
    return (
      <>
        <h1 className="mb-1 text-3xl font-bold text-white">Profile</h1>
        <p className="rounded-xl bg-red-500/20 p-4 text-white">{error}</p>
        <p className="mt-4 text-sm text-white/70">
          If you just signed up, confirm your email first, then sign in. For local dev, use{' '}
          <a href="http://localhost:8888" className="font-semibold text-gold-light underline">
            localhost:8888
          </a>
          .
        </p>
      </>
    )
  }

  if (!user) return null

  const accuracy =
    user.totalPredictions > 0
      ? Math.round((1000 * user.correctPredictions) / user.totalPredictions) / 10
      : 0

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold text-white">Profile</h1>
      <p className="mb-6 text-white/65">{user.displayName}</p>
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { num: user.coinBalance.toLocaleString(), lbl: 'Coin balance' },
          { num: `${accuracy}%`, lbl: 'Correct picks' },
          { num: String(user.totalPredictions), lbl: 'Total bets' },
        ].map((s) => (
          <div key={s.lbl} className="rounded-xl bg-white p-5 text-center shadow">
            <div className="text-2xl font-extrabold text-pitch">{s.num}</div>
            <div className="mt-1 text-sm text-gray-500">{s.lbl}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow">
        <strong className="text-pitch">Account</strong>
        <p className="mt-3 text-sm text-gray-600">Email: {user.email.replace(/(.{2}).+(@.*)/, '$1***$2')}</p>
        <p className="mt-1 text-sm text-gray-500">Display name: {user.displayName}</p>
      </div>
    </>
  )
}
