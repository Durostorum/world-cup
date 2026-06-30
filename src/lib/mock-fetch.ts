import {
  mockBetHistory,
  mockBets,
  mockLeaderboard,
  mockMatches,
  mockUser,
} from './mock-data'

export async function mockFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await new Promise((r) => setTimeout(r, 100))
  const url = new URL(path, 'http://local')
  const method = init?.method ?? 'GET'

  if (path.startsWith('/matches')) {
    const id = url.searchParams.get('id')
    if (id) {
      const match = mockMatches.find((m) => m.id === id)
      if (!match) throw new Error('Match not found')
      return { match, betHistory: mockBetHistory } as T
    }
    return { matches: mockMatches } as T
  }

  if (path === '/leaderboard') {
    return { entries: mockLeaderboard } as T
  }

  if (path.startsWith('/bets')) {
    if (method === 'GET') return { bets: mockBets } as T
    if (method === 'POST') {
      const body = JSON.parse(String(init?.body))
      return {
        bet: { ...mockBets[0], stake: body.stake },
        coinBalance: mockUser.coinBalance - body.stake,
      } as T
    }
  }

  if (path === '/profile') {
    return { user: mockUser } as T
  }

  throw new Error(`Mock route not found: ${path}`)
}
