# World Cup 2026 Prediction Pool — Build Guide

Technical implementation guide for the app described in [plan.md](./plan.md). Targets **Netlify** for hosting, auth, database, and serverless APIs.

---

## 1. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | **Vite + React + TypeScript** | Fast dev, Netlify-native static deploy |
| Styling | **Tailwind CSS** | Rapid World Cup–themed UI |
| Routing | **React Router** | Simple SPA routes |
| Auth | **@netlify/identity** | Signup/login, JWT for API protection |
| Database | **Netlify Database** (Postgres) + **Drizzle ORM `@beta`** | Relational data, migrations, preview branches |
| API | **Netlify Functions** | Bet placement, settlement, sync jobs |
| Scheduled jobs | **Netlify scheduled functions** (minimal: midnight unlock, lock at first kickoff, daily settle) |
| Deploy | **Netlify CLI** (`npx netlify dev`, `npx netlify deploy`) | Git-based CI/CD |

---

## 2. Repository Structure

```
world-cup/
├── netlify/
│   └── functions/
│       ├── bets.mts              # POST/PUT bets
│       ├── matches.mts           # GET matches
│       ├── leaderboard.mts       # GET standings
│       ├── sync-fixtures.mts     # Manual or daily: FIFA schedule
│       ├── sync-results.mts      # Daily: match results
│       ├── sync-odds.mts         # Midnight + pre-lock: odds refresh
│       ├── lock-matchday.mts     # At first kickoff: lock all bets for the day
│       └── settle-matches.mts    # Daily: payout processing
├── db/
│   ├── schema.ts                 # Drizzle schema
│   └── migrations/               # Generated SQL migrations
├── scripts/
│   ├── seed-teams.ts             # 48 nations + codes
│   └── seed-matches.ts           # Import from FIFA JSON/CSV
├── src/
│   ├── components/
│   │   ├── MatchCard.tsx
│   │   ├── BetSlider.tsx
│   │   ├── TeamPickButton.tsx
│   │   ├── LeaderboardTable.tsx
│   │   └── CoinBalance.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Matches.tsx
│   │   ├── MatchDetail.tsx
│   │   ├── MyBets.tsx
│   │   ├── Leaderboard.tsx
│   │   └── Profile.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── betting-window.ts     # isBettingOpen, getMatchdayLockTime
│   │   └── odds.ts               # probability ↔ decimal conversion
│   ├── App.tsx
│   └── main.tsx
├── drizzle.config.ts
├── netlify.toml
├── package.json
├── plan.md
└── build.md
```

---

## 3. Environment & Prerequisites

- Node.js 20+
- Netlify account
- Netlify CLI 26+ (`npm install -g netlify-cli`)

```bash
# Clone / init project
npm create vite@latest . -- --template react-ts
npm install

# Netlify + database + auth
npm install @netlify/database @netlify/identity drizzle-orm@beta
npm install -D drizzle-kit@beta tailwindcss @tailwindcss/vite

# App dependencies
npm install react-router-dom date-fns date-fns-tz zod
```

Enable **Identity** in Netlify dashboard: Project configuration → Identity → Enable (Registration: Open).

---

## 4. Database Schema

Create `db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, integer, numeric, pgEnum, date, boolean } from 'drizzle-orm/pg-core'

export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished', 'postponed'])
export const betStatusEnum = pgEnum('bet_status', ['open', 'locked', 'won', 'lost'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                    // Netlify Identity user id
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  coinBalance: integer('coin_balance').notNull().default(10000),
  totalPredictions: integer('total_predictions').notNull().default(0),
  correctPredictions: integer('correct_predictions').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  fifaCode: text('fifa_code').notNull().unique(),  // e.g. USA, BRA
  flagUrl: text('flag_url'),
})

export const matchdays = pgTable('matchdays', {
  matchdayDate: date('matchday_date').primaryKey(),           // Eastern calendar date (America/New_York)
  firstKickoffAt: timestamp('first_kickoff_at', { withTimezone: true }).notNull(),
  bettingClosed: boolean('betting_closed').notNull().default(false),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fifaMatchNumber: integer('fifa_match_number').notNull().unique(),
  stage: text('stage').notNull(),                   // group_a, round_of_32, final, etc.
  groupCode: text('group_code'),                    // A–L for group stage
  teamAId: uuid('team_a_id').references(() => teams.id),
  teamBId: uuid('team_b_id').references(() => teams.id),
  kickoffAt: timestamp('kickoff_at', { withTimezone: true }).notNull(),
  matchdayDate: date('matchday_date').notNull(),    // Eastern date of kickoff; FK to matchdays
  venue: text('venue'),
  city: text('city'),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  scoreA: integer('score_a'),
  scoreB: integer('score_b'),
  winnerTeamId: uuid('winner_team_id').references(() => teams.id),
  teamAOdds: numeric('team_a_odds', { precision: 6, scale: 2 }),
  teamBOdds: numeric('team_b_odds', { precision: 6, scale: 2 }),
  oddsUpdatedAt: timestamp('odds_updated_at', { withTimezone: true }),
})

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  pickedTeamId: uuid('picked_team_id').references(() => teams.id).notNull(),
  stake: integer('stake').notNull(),
  oddsAtLock: numeric('odds_at_lock', { precision: 6, scale: 2 }),
  status: betStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
})

export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),              // negative = debit, positive = credit
  reason: text('reason').notNull(),                 // signup_bonus, bet_placed, bet_increase, payout
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

Initialize database:

```bash
netlify link                    # link to Netlify site
netlify database init --yes     # provisions Postgres + drizzle config
npx drizzle-kit generate
netlify database migrations apply   # local only — deploy applies prod migrations
```

---

## 5. API Endpoints

### `GET /api/matches`

Query params: `stage`, `status`, `from`, `to`

Returns matches with team names, odds, user’s bet (if authenticated), and `bettingOpen` / `bettingClosesAt` for the matchday.

### `POST /api/bets`

Body: `{ matchId, pickedTeamId, stake }`

**Logic (transactional):**
1. Verify user via `getUser()` from `@netlify/identity`
2. Load match and its matchday row
3. Reject if `bettingClosed === true` or `now >= firstKickoffAt` or `now < bettingOpensAtEastern(matchdayDate)` or `status !== 'scheduled'`
4. Reject if odds missing for picked team
5. If no existing bet: deduct `stake` from balance, create bet
6. If existing bet on same team: deduct only the **increment**, increase stake
7. If existing bet on other team: reject
8. Write `coin_transactions` row

**No per-bet cron needed** — the API enforces the daily window on every request.

### `GET /api/leaderboard`

Returns users ordered by `coin_balance` DESC with computed `accuracy_pct`:

```sql
CASE WHEN total_predictions > 0
  THEN ROUND(100.0 * correct_predictions / total_predictions, 1)
  ELSE 0 END AS accuracy_pct
```

### Admin-only (role: `admin` in Identity JWT)

- `POST /api/admin/matches` — upsert match
- `POST /api/admin/matches/:id/result` — set score + winner, trigger settlement
- `POST /api/admin/sync-fixtures` — manual FIFA sync

---

## 6. Core Server Logic

### 6.1 Signup bonus

Netlify Identity webhook or first-login function:

```typescript
// On first login: if no users row, insert with coin_balance = 10000
// Insert coin_transactions: +10000, reason = 'signup_bonus'
```

Use Identity `user.metadata` flag `onboarded: true` to avoid double credit.

### 6.2 Daily betting window

Create `src/lib/betting-window.ts` (shared logic; import in functions too):

```typescript
import { format } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

/** Eastern Time — handles EST/EDT automatically (EDT during Jun–Jul 2026). */
export const BETTING_TIMEZONE = 'America/New_York'

/** Calendar date in Eastern for a kickoff instant. */
export function getMatchdayDate(kickoffAt: Date): string {
  return format(toZonedTime(kickoffAt, BETTING_TIMEZONE), 'yyyy-MM-dd')
}

/** Betting opens at midnight Eastern on the matchday. */
export function bettingOpensAt(matchdayDate: string): Date {
  return fromZonedTime(`${matchdayDate}T00:00:00`, BETTING_TIMEZONE)
}

/** Betting closes when the first match of the day kicks off. */
export function isBettingOpen(
  matchday: { matchdayDate: string; firstKickoffAt: Date; bettingClosed: boolean },
  now = new Date()
): boolean {
  if (matchday.bettingClosed) return false
  if (now < bettingOpensAt(matchday.matchdayDate)) return false
  if (now >= matchday.firstKickoffAt) return false
  return true
}
```

**Seed `matchdays` when importing fixtures:**

```typescript
// Group matches by Eastern calendar date; firstKickoffAt = MIN(kickoff_at) per group
for (const [date, dayMatches] of groupedByEasternMatchday) {
  await db.insert(matchdays).values({
    matchdayDate: date,
    firstKickoffAt: min(dayMatches.map(m => m.kickoffAt)),
    bettingClosed: false,
  })
}
```

### 6.3 Daily lock job (runs once near first kickoff)

Schedule `lock-matchday` to run **every 15 minutes** (or once at the expected first kickoff — cheap on free tier). No need for per-minute polling.

```typescript
const now = new Date()
for (const matchday of openMatchdays where now >= firstKickoffAt) {
  const dayMatches = await getMatchesForMatchday(matchday.matchdayDate)
  for (const bet of openBets on dayMatches) {
    const match = dayMatches.find(m => m.id === bet.matchId)
    const odds = bet.pickedTeamId === match.teamAId ? match.teamAOdds : match.teamBOdds
    await db.update(bets).set({ status: 'locked', oddsAtLock: odds, lockedAt: now })
  }
  await db.update(matchdays).set({ bettingClosed: true, lockedAt: now })
}
```

The bet API also rejects new stakes after `firstKickoffAt`, so the job is mainly for snapshotting `oddsAtLock` and flipping bet status.

### 6.4 Settlement job

```typescript
for (const match of finishedMatches where not settled) {
  for (const bet of lockedBets on match) {
    if (bet.pickedTeamId === match.winnerTeamId) {
      const payout = Math.floor(bet.stake * Number(bet.oddsAtLock))
      await creditUser(bet.userId, payout, 'payout', bet.id)
      await db.update(bets).set({ status: 'won', settledAt: now })
      await incrementCorrect(bet.userId)
    } else {
      await db.update(bets).set({ status: 'lost', settledAt: now })
    }
    await incrementTotalPredictions(bet.userId)
  }
}
```

Run settlement idempotently: skip bets already `won` or `lost`. **Run once daily** (evening) or via admin button — not every 5 minutes.

### 6.5 Odds conversion

```typescript
// From prediction market probability (0–1) to decimal odds
export function probabilityToDecimalOdds(p: number): number {
  const clamped = Math.min(Math.max(p, 0.02), 0.98)
  return Math.min(Math.max(1 / clamped, 1.01), 50)
}

// Display implied probability
export function oddsToImpliedPercent(odds: number): number {
  return Math.round((100 / odds) * 10) / 10
}
```

---

## 7. Fixture & Odds Ingestion

### 7.1 FIFA schedule seed

1. Download/parse [FIFA schedule PDF](https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule/_English.pdf) or scrape the [FIFA fixtures page](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums) into normalized JSON
2. Map to `matches` + `teams` tables
3. Store kickoffs as UTC in the database (`2026-06-11T19:00:00Z` for Mexico City opener); derive `matchday_date` in **Eastern** via `getMatchdayDate()`

**MVP approach:** commit a static `data/fixtures-2026.json` generated once from FIFA, refresh via scheduled sync during tournament.

### 7.2 Results sync

Poll FIFA results endpoint or page for `status = finished` updates. Set `winner_team_id` using official winner (including ET/PEN for knockouts).

### 7.3 Odds sync

**Option A — Manual (MVP):** Admin panel to paste decimal odds from [Covers](https://www.covers.com/world-cup/odds) or [Kalshi](https://kalshi.com).

**Option B — The Odds API:**

```bash
# GET https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds
# Header: apiKey=YOUR_KEY
```

Map `home_team` / `away_team` to internal team IDs; use `h2h` market decimal odds.

**Option C — Kalshi/Polymarket:** Fetch public market prices; convert cents (47¢ → `p=0.47` → odds `2.13`).

Schedule: refresh odds at **midnight Eastern** when the matchday opens; optional second refresh **30–60 min before first kickoff**.

---

## 8. Frontend Components

### `TeamPickButton`

- Thumbs-up icon, team flag, decimal odds, implied %
- Active state when selected
- Disabled when matchday is locked, before midnight open, or when match is finished

### `BetSlider`

- Range input: `1 … user.coinBalance` (or remaining if increasing)
- Live preview: “Potential return: {stake × odds} coins”
- Countdown or label: “Betting closes at {firstKickoff} ET”
- Confirm button

### `LeaderboardTable`

- Sortable columns: rank, name, coins, accuracy %, total bets
- Highlight current user row

### Auth wrapper

```typescript
import { onAuthChange, getUser, signup, login } from '@netlify/identity'

// Redirect unauthenticated users from /my-bets and bet actions
```

> **Note:** `@netlify/identity` requires a deployed Netlify site for full testing. Use `npx netlify deploy` for preview deploys during auth development.

---

## 9. netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Scheduled functions — cron is UTC; Eastern midnight ≈ 04:00 UTC during EDT (Jun–Jul 2026)
[functions."sync-odds"]
  schedule = "0 4 * * *"         # ~midnight Eastern (EDT): open matchday, refresh odds

[functions."lock-matchday"]
  schedule = "*/15 * * * *"      # every 15 min: lock when first kickoff passed

[functions."sync-results"]
  schedule = "0 8 * * *"         # ~04:00 Eastern: pull results

[functions."settle-matches"]
  schedule = "0 9 * * *"         # ~05:00 Eastern: settle finished matches
```

---

## 10. Implementation Phases

### Phase 1 — Scaffold (Day 1–2)

- [ ] Vite + React + Tailwind + React Router
- [ ] Netlify link, Identity enable, Database init
- [ ] Drizzle schema + first migration
- [ ] Basic layout and World Cup theme tokens

### Phase 2 — Auth & Users (Day 2–3)

- [ ] Signup / login UI
- [ ] User row creation + 10,000 coin bonus
- [ ] Profile page with balance

### Phase 3 — Matches (Day 3–5)

- [ ] Seed 48 teams + 104 matches from FIFA data
- [ ] Matches list and detail pages
- [ ] Admin script to enter odds manually

### Phase 4 — Betting (Day 5–7)

- [ ] MatchCard with thumbs-up + slider + “closes at first kickoff” banner
- [ ] POST /api/bets with daily-window checks
- [ ] My Bets page (open vs locked vs settled)
- [ ] `lock-matchday` job at first kickoff

### Phase 5 — Settlement & Leaderboard (Day 7–9)

- [ ] Admin result entry (MVP) or FIFA sync
- [ ] Settlement function + coin transactions
- [ ] Leaderboard page

### Phase 6 — Automation & Polish (Day 9–12)

- [ ] Scheduled odds + results sync
- [ ] Error states, loading skeletons, toasts
- [ ] Legal disclaimer footer
- [ ] Mobile QA, accessibility pass

### Phase 7 — Deploy

```bash
npm run build
npx netlify deploy --prod
```

Set environment variables in Netlify UI:
- `ODDS_API_KEY` (if using The Odds API)
- Any FIFA API key if a licensed feed is used

---

## 11. Testing Checklist

| Test | Expected |
|------|----------|
| New signup | Balance = 10,000; one signup_bonus transaction |
| Place bet after midnight | Allowed for today’s matches |
| Place bet before midnight Eastern | Rejected — “Betting opens at midnight ET” |
| Place bet after first kickoff | Rejected — “Betting closed for today” |
| Increase stake before lock | Only delta deducted; same team enforced |
| Increase stake after first kickoff | Rejected even for later matches same day |
| Switch team | Rejected |
| Daily lock job | All open bets for matchday → `locked` with `oddsAtLock` |
| Correct result | Payout = stake × odds; status `won` |
| Wrong result | No payout; status `lost` |
| Leaderboard accuracy | 2/5 correct → 40.0% |
| Double settlement | No duplicate payouts |

Use Drizzle + transaction blocks for all balance mutations to prevent race conditions.

---

## 12. Security Notes

- All bet endpoints require valid Identity JWT
- Validate `stake > 0` and `stake <= balance` server-side (never trust client)
- Rate-limit bet POSTs (e.g. 10/min per user)
- Admin routes gated on Identity role `admin`
- Sanitize display names
- CORS: restrict to production domain in functions

---

## 13. Local Development

```bash
# Terminal 1 — Vite
npm run dev

# Terminal 2 — Netlify (functions + env)
npx netlify dev

# Database migrations (local only)
netlify database migrations apply

# Seed data
npx tsx scripts/seed-teams.ts
npx tsx scripts/seed-matches.ts
```

---

## 14. Key Commands Reference

```bash
netlify link
netlify database init --yes
npx drizzle-kit generate
netlify database migrations apply    # local DB only
npm run build
npx netlify deploy                   # preview
npx netlify deploy --prod            # production
netlify database status              # check DB provisioning
```

---

## 15. Next Step

Run Phase 1 scaffold commands, then implement schema and seed scripts. See [plan.md](./plan.md) for product rules and data source URLs.
