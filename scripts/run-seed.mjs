import { execSync, spawnSync } from 'node:child_process'

function localConnectionString() {
  const out = execSync('npx netlify database connect --json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const parsed = JSON.parse(out)
  if (!parsed.connection_string) {
    throw new Error('Netlify database connect did not return a connection_string.')
  }
  return parsed.connection_string
}

try {
  const connectionString = localConnectionString()
  const result = spawnSync('npm', ['run', 'seed'], {
    stdio: 'inherit',
    env: { ...process.env, NETLIFY_DB_URL: connectionString },
    shell: true,
  })
  process.exit(result.status ?? 1)
} catch (err) {
  console.error(
    '\nCould not connect to the local Netlify Database.\n' +
      '• Run `npm run db:migrate` first.\n' +
      '• Do not set DATABASE_URL in .env unless you run your own Postgres.\n',
  )
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
