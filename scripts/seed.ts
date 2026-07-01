/**
 * Seeds teams and World Cup 2026 fixtures into Netlify Database.
 * Prefer: npm run dev:setup (seeds through the running dev server).
 */
import { runSeed } from '../netlify/functions/shared/seed-data.js'

runSeed()
  .then((count) => {
    console.log(`Seed complete: ${count} fixtures synced.`)
  })
  .catch((err) => {
    const refused =
      (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'ECONNREFUSED') ||
      (err instanceof Error &&
        'cause' in err &&
        typeof err.cause === 'object' &&
        err.cause !== null &&
        'code' in err.cause &&
        (err.cause as { code?: string }).code === 'ECONNREFUSED')

    if (refused) {
      console.error(
        '\nDatabase connection refused.\n' +
          '• Terminal 1: npm run dev:local\n' +
          '• Terminal 2: npm run dev:setup\n' +
          'Standalone `npm run seed` cannot reach the local DB — use dev:setup instead.\n',
      )
    } else {
      console.error(err)
    }
    process.exit(1)
  })
