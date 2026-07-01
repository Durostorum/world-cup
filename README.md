# World Cup Pool 2026

A Polymarket-inspired prediction pool for the FIFA World Cup 2026. Members use fictional coins to bet on match winners and compete on a public leaderboard.

**Repository:** https://github.com/Durostorum/world-cup

- **Product spec:** [plan.md](./plan.md)
- **Build guide:** [build.md](./build.md)
- **UI mocks:** [mock/](./mock/) · [mock-screenshots/](./mock-screenshots/)

## Stack

- Vite + React + TypeScript + Tailwind CSS
- Netlify (hosting, Identity, Functions, Database)
- Drizzle ORM + Postgres

## Quick start

### UI only (mock data, no backend)

```bash
cp .env.example .env   # VITE_USE_MOCK=true by default
npm install
npm run dev            # http://localhost:5173
```

### Full local stack (functions + Postgres + real API)

```bash
npm install
npm run dev:local      # http://localhost:8888  ← use this URL, not :5173
```

First time only, in a **second terminal** while `dev:local` is running:

```bash
npm run dev:setup      # apply migrations + seed demo matches & user
```

**Important:** Do not set `DATABASE_URL` in `.env` for local dev. That value overrides Netlify’s embedded Postgres and causes `ECONNREFUSED` if you aren’t running your own database on `localhost:5432`.

If seed fails with “connection refused”, make sure `npm run dev:local` is running first (it starts the local Postgres in `.netlify/db/`). Stop any other Vite/Netlify dev processes if ports `5173` or `8888` are already in use.

Local demo user (optional): set `VITE_ENABLE_DEMO_AUTH=true` and `VITE_DEMO_USER_ID` in `.env` — otherwise sign up via Identity for 10,000 coins.

```bash
npm run dev:netlify    # alias for dev:local
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest |
| `npm run lint` | ESLint |
| `npm run screenshots` | Regenerate mock PNGs via Puppeteer |

## Security

- Never commit `.env` — use `.env.example` as a template
- Server secrets live in Netlify environment variables only
- All bet mutations are validated server-side with auth checks

## License

Private — for personal / community use.
