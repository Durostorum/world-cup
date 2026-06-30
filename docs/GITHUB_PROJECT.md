# GitHub Issues (detailed)

**Project board:** https://github.com/users/Durostorum/projects/3  
**Repository:** https://github.com/Durostorum/world-cup

## Completed (MVP — no issue)

- [x] Product plan & build guide
- [x] UI mocks + Puppeteer screenshots
- [x] Vite + React + Tailwind scaffold
- [x] All pages (Home, Matches, Detail, My Bets, Leaderboard, Profile)
- [x] Knockout bracket on home
- [x] Flag images on all team names
- [x] Netlify Functions API (in-memory store for dev)
- [x] Daily betting window logic + unit tests
- [x] GitHub Actions CI (build + test)
- [x] `.env.example` + `.gitignore` (`.env` never committed)

## Open issues

| # | Title | Labels |
|---|-------|--------|
| [#1](https://github.com/Durostorum/world-cup/issues/1) | Integrate Netlify Database with Drizzle ORM | database, backend |
| [#2](https://github.com/Durostorum/world-cup/issues/2) | Implement Netlify Identity authentication | security, backend, frontend |
| [#3](https://github.com/Durostorum/world-cup/issues/3) | Seed FIFA 2026 fixtures and matchdays | database, backend |
| [#4](https://github.com/Durostorum/world-cup/issues/4) | Scheduled jobs: lock matchday and settle bets | backend, devops |
| [#5](https://github.com/Durostorum/world-cup/issues/5) | Odds ingestion from reputable sources | backend |
| [#6](https://github.com/Durostorum/world-cup/issues/6) | Security hardening pass | security, backend |
| [#7](https://github.com/Durostorum/world-cup/issues/7) | Netlify production deployment | devops |
| [#8](https://github.com/Durostorum/world-cup/issues/8) | Expand test coverage for betting rules | testing, backend |

## Suggested work order

1. #1 Database → #3 Seed data  
2. #2 Identity  
3. #4 Lock/settle jobs → #5 Odds  
4. #6 Security → #8 Tests → #7 Deploy
