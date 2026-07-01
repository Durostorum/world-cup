import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="text-white">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return children
}
