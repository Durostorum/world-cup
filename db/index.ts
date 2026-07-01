import { getDatabase } from '@netlify/database'

import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.js'



let db: ReturnType<typeof drizzle<typeof schema>> | undefined



export function getDb() {

  if (!db) {

    let pool



    try {

      ;({ pool } = getDatabase())

    } catch {

      const connectionString =

        process.env.NETLIFY_DATABASE_URL ||

        process.env.NETLIFY_DB_URL ||

        process.env.DATABASE_URL



      if (!connectionString) {
        const isProduction = process.env.CONTEXT === 'production'
        const message = isProduction
          ? 'Missing database connection. NETLIFY_DB_URL should be automatically injected in production. Check your Netlify site configuration.'
          : 'Missing database connection. Start `npm run dev:local`, then run `npm run dev:setup` in another terminal. Leave DATABASE_URL unset in .env — Netlify provides the local database automatically.'
        throw new Error(message)
      }



      ;({ pool } = getDatabase({ connectionString }))

    }



    db = drizzle({ client: pool, schema })

  }



  return db

}



export type Db = ReturnType<typeof getDb>


