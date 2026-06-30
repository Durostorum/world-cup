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

```bash
cp .env.example .env
npm install
npm run dev          # Vite frontend (localhost:5173)
npm run dev:netlify  # Frontend + Netlify Functions
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
