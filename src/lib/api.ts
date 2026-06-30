const API_BASE = '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    const { mockFetch } = await import('./mock-fetch')
    return mockFetch<T>(path, init)
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
  getBets: (userId?: string) =>
    request<{ bets: import('./types').Bet[] }>(
      userId ? `/bets?userId=${encodeURIComponent(userId)}` : '/bets',
    ),
  placeBet: (body: { matchId: string; pickedTeamId: string; stake: number }) =>
    request<{ bet: import('./types').Bet; coinBalance: number }>('/bets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getProfile: () => request<{ user: import('./types').UserProfile }>('/profile'),
}
