import { resolveAuthToken } from './identity-token'

const API_BASE = '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    const { mockFetch } = await import('./mock-fetch')
    return mockFetch<T>(path, init)
  }

  const authToken = await resolveAuthToken()
  const demoAuthEnabled = import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'
  const demoUserId = import.meta.env.VITE_DEMO_USER_ID as string | undefined
  const useDemoHeaders = demoAuthEnabled && !authToken && demoUserId
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(useDemoHeaders
        ? { 'X-User-Id': demoUserId, 'X-User-Email': 'demo@local.dev' }
        : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getMatches: () => request<{ matches: import('./types').Match[] }>('/matches'),
  getMatch: (id: string) =>
    request<{ match: import('./types').Match; betHistory: import('./types').BetHistoryEntry[] }>(
      `/matches?id=${encodeURIComponent(id)}`,
    ),
  getLeaderboard: () => request<{ entries: import('./types').LeaderboardEntry[] }>('/leaderboard'),
  getBets: () => request<{ bets: import('./types').Bet[] }>('/bets'),
  placeBet: (body: { matchId: string; pickedTeamId: string; stake: number }) =>
    request<{ bet: import('./types').Bet; coinBalance: number }>('/bets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getProfile: () => request<{ user: import('./types').UserProfile }>('/profile'),
}
