import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const betSchema = z.object({
  matchId: z.string().min(1),
  pickedTeamId: z.string().min(1),
  stake: z.number().int().positive().max(1_000_000),
})

describe('bet validation', () => {
  it('rejects negative stake', () => {
    const r = betSchema.safeParse({ matchId: 'm-1', pickedTeamId: 't-1', stake: -5 })
    expect(r.success).toBe(false)
  })

  it('accepts valid bet', () => {
    const r = betSchema.safeParse({ matchId: 'm-1', pickedTeamId: 't-1', stake: 100 })
    expect(r.success).toBe(true)
  })
})
