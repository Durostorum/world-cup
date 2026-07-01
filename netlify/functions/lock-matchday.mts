import { lockDueMatchdays } from './shared/betting.js'

/** Every 15 min: lock open bets once a matchday's first kickoff has passed. */
export default async () => {
  try {
    const result = await lockDueMatchdays()
    console.log('lock-matchday:', result)
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('lock-matchday failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Lock failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
