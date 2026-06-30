import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { UserProfile } from '../lib/types'

export function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    api.getProfile().then((r) => setUser(r.user))
  }, [])

  if (!user) return <p className="text-white">Loading…</p>

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
