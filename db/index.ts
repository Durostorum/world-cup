/**
 * Database client — requires @netlify/database at runtime on Netlify.
 * Local dev uses in-memory store in netlify/functions/shared/store.ts until linked.
 */
export async function getDb() {
  const { drizzle } = await import('drizzle-orm/netlify-db')
  const schema = await import('../db/schema.js')
  return drizzle({ schema })
}
