import { eq } from 'drizzle-orm'
import { getDb } from '../../../db/index.js'
import { coinTransactions, users } from '../../../db/schema.js'

const SIGNUP_BONUS = 10_000

export async function ensureUser(params: {
  id: string
  email: string
  displayName?: string
}) {
  const db = getDb()
  const [existing] = await db.select().from(users).where(eq(users.id, params.id)).limit(1)
  if (existing) return existing

  const displayName = params.displayName?.trim() || params.email.split('@')[0] || 'Player'

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        id: params.id,
        email: params.email,
        displayName,
        coinBalance: SIGNUP_BONUS,
      })
      .onConflictDoNothing()
      .returning()

    if (created) {
      await tx.insert(coinTransactions).values({
        userId: created.id,
        amount: SIGNUP_BONUS,
        reason: 'signup_bonus',
      })
      return created
    }

    const [row] = await tx.select().from(users).where(eq(users.id, params.id)).limit(1)
    if (!row) throw new Error('Failed to create user profile')
    return row
  })
}

export function maskEmail(email: string) {
  return email.replace(/(.{2}).+(@.*)/, '$1***$2')
}
