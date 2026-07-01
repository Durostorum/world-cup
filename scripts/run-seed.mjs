const DEV_URL = process.env.NETLIFY_DEV_URL ?? 'http://127.0.0.1:8888'
const MAX_WAIT_MS = 60_000

async function waitForDev() {
  const started = Date.now()
  process.stdout.write(`Waiting for ${DEV_URL} (start npm run dev:local in another terminal)...`)

  while (Date.now() - started < MAX_WAIT_MS) {
    try {
      const res = await fetch(`${DEV_URL}/api/matches`)
      if (res.ok) {
        process.stdout.write(' ready\n')
        return true
      }
    } catch {
      // dev server not up yet
    }
    process.stdout.write('.')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  process.stdout.write('\n')
  return false
}

async function seedViaDevServer() {
  const res = await fetch(`${DEV_URL}/api/dev/seed`, { method: 'POST' })
  const body = await res.text()
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    parsed = { error: body || `HTTP ${res.status}` }
  }

  if (!res.ok) {
    throw new Error(parsed.error ?? `Seed failed with HTTP ${res.status}`)
  }

  console.log(`Seed complete: ${parsed.fixtures} fixtures synced.`)
}

try {
  const ready = await waitForDev()
  if (!ready) {
    console.error(
      '\nCould not reach the local Netlify dev server.\n' +
        '• Terminal 1: npm run dev:local\n' +
        '• Terminal 2: npm run dev:setup\n',
    )
    process.exit(1)
  }

  await seedViaDevServer()
} catch (err) {
  console.error('\nSeed failed.')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
