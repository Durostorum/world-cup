import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getUser, refreshSession } from '@netlify/identity'
import { error, handleOptions, requireAuth } from './http.js'

vi.mock('@netlify/identity', () => ({
  getUser: vi.fn(),
  refreshSession: vi.fn(),
  getIdentityConfig: vi.fn(() => null),
}))

function req(method: string, origin?: string) {
  return new Request('http://localhost/.netlify/functions/bets', {
    method,
    headers: origin ? { Origin: origin } : {},
  })
}

describe('http security boundary', () => {
  beforeEach(() => {
    vi.mocked(refreshSession).mockResolvedValue(null)
  })

  it('allows CORS preflight from localhost', () => {
    const res = handleOptions(req('OPTIONS', 'http://localhost:5173'))
    expect(res?.status).toBe(204)
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    expect(res?.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })

  it('rejects CORS preflight from unknown origins', () => {
    const res = handleOptions(req('OPTIONS', 'https://evil.example'))
    expect(res?.status).toBe(403)
  })

  it('requireAuth returns 401 when no identity session', async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    const res = await requireAuth(req('GET', 'http://localhost:5173'))
    expect(res).toBeInstanceOf(Response)
    expect((res as Response).status).toBe(401)
  })

  it('requireAuth returns user id from identity context', async () => {
    vi.mocked(getUser).mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'player@example.com',
    } as Awaited<ReturnType<typeof getUser>>)

    const res = await requireAuth(req('GET', 'http://localhost:5173'))
    expect(res).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'player@example.com',
    })
  })

  it('requireAuth accepts a valid Bearer JWT when Identity /user is unreachable', async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    const payload = Buffer.from(JSON.stringify({ sub: '11111111-1111-1111-1111-111111111111', email: 'player@example.com' })).toString('base64url')
    const token = `header.${payload}.sig`
    const res = await requireAuth(
      new Request('http://localhost/.netlify/functions/profile', {
        method: 'GET',
        headers: { Origin: 'http://localhost:8888', Authorization: `Bearer ${token}` },
      }),
    )
    expect(res).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'player@example.com',
    })
  })

  it('error responses include restricted CORS headers for allowed origin', () => {
    const res = error(req('POST', 'http://localhost:8888'), 'Nope', 400)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8888')
  })
})
