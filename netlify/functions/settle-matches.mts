import { settleFinishedMatches } from './shared/betting.js'

/** Daily: pay out winning locked bets on finished matches. */
export default async () => {
  try {
    const result = await settleFinishedMatches()
    console.log('settle-matches:', result)
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('settle-matches failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Settlement failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
