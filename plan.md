# World Cup 2026 Prediction Pool — Product Plan

A Polymarket-inspired web app where registered members use fictional coins to predict match winners during the **FIFA World Cup 2026** (USA, Canada, Mexico). This is a social prediction game — not real-money gambling.

> **Naming note:** The tournament is the FIFA World Cup (not UEFA). UEFA governs European club/international competition; the 2026 edition is the 48-team FIFA World Cup running **11 June – 19 July 2026**.

---

## 1. Vision & Goals

| Goal | Description |
|------|-------------|
| **Engagement** | Let fans stake fictional coins on match outcomes and compete on a public leaderboard |
| **Simplicity** | One-tap team pick (thumbs up) + slider to set stake — no complex order books |
| **Fairness** | Odds sourced from reputable markets; daily betting window with a single lock time; payouts are deterministic |
| **Trust** | Fixtures and results from official FIFA sources; odds refreshed on a defined schedule |

**Success metrics**
- Registered users who place at least one bet
- Average bets per active user per matchday
- Return visits during knockout rounds
- Leaderboard page views

---

## 2. Target Users

- Football fans following World Cup 2026
- Friends, office pools, or communities who want a lightweight prediction competition
- Casual users who want Polymarket-style UX without real money

---

## 3. Core Features

### 3.1 Authentication & Onboarding

- Email/password signup and login (OAuth optional later: Google, Apple)
- On **first successful registration**, credit **10,000 fictional coins** (one-time welcome bonus)
- Profile shows: display name, coin balance, prediction stats
- Email verification recommended for production

### 3.2 Match Schedule

Display all tournament matches with:

- Match number (FIFA numbering, 1–104)
- Stage (Group A–L, Round of 32, Round of 16, Quarter-final, Semi-final, Third place, Final)
- Home team vs away team (or Team A vs Team B for TBD knockout slots)
- Kickoff datetime (stored in UTC in the database, displayed in **Eastern Time (EST/EDT)**)
- Venue / host city
- Status: `scheduled` | `live` | `finished` | `postponed`
- Final score and winner (when available)

**Data sources (verified, in priority order)**

| Source | Use |
|--------|-----|
| [FIFA World Cup 2026 schedule](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums) | Primary fixture list, kickoff times, venues, live results |
| [FIFA official PDF schedule](https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule/_English.pdf) | Bulk import / validation reference |
| [FIFA media releases](https://inside.fifa.com/organisation/media-releases/updated-world-cup-2026-match-schedule-venues-kick-off-times-104-matches) | Schedule updates and TBD slot resolution |

**Sync strategy**
- Seed database from FIFA schedule at build/deploy time
- Background job (every 6–12 hours during tournament, hourly on match days) refreshes kickoff times, team names for TBD slots, and final results
- Manual admin override for postponements

### 3.3 Betting (Predictions)

Each match card shows two sides: **Team A** (left) and **Team B** (right).

#### Daily betting window

All matches on the same **matchday** share one betting window:

| Event | When |
|-------|------|
| **Betting opens** | **Midnight Eastern Time (00:00 EST/EDT)** on the calendar date of the match |
| **Betting closes** | **First kickoff of that day (Eastern)** — when the earliest match on that matchday starts, **all** bets for that day’s matches lock |

Example: on 15 June 2026, four matches kick off at 10:00, 13:00, 16:00, and 19:00 **Eastern**. Betting opens at **00:00 Eastern on 15 June** and closes at **10:00 Eastern** when the first game starts. After 10:00 Eastern, no new bets or stake increases are allowed for any of that day’s matches — even the 19:00 game.

> **Timezone:** Matchdays are grouped by the **Eastern calendar date** of `kickoff_at` (`America/New_York`). During the tournament (Jun–Jul 2026) clocks are on **EDT (UTC−4)**; the app uses the `America/New_York` zone so DST is handled automatically. All betting open/close times in the UI are shown in Eastern Time.

**Interaction flow**
1. User taps **thumbs up** on the team they predict will win (90-minute result; see draw rule below)
2. A **stake slider** appears (min 1 coin, max = current balance)
3. User confirms stake; coins are **reserved** (deducted from spendable balance)
4. User may **increase** stake on the same pick until the **daily lock** (first kickoff of the matchday)
5. At the daily lock, all bets for that matchday **lock** — no edits, no cancellation
6. User may only have **one active pick per match** (one team, one combined stake)

**Draw handling (required for knockout clarity)**

| Stage | Rule |
|-------|------|
| Group stage | If match ends in a draw, bets on either team to *win* lose; optional future enhancement: “Draw” third option |
| Knockout (R32 onward) | Resolve winner after extra time / penalties per FIFA result — same as official “winner” field |

Document this clearly in the UI so users are not surprised.

### 3.4 Odds (Win Ratios)

Each team per match has a **decimal multiplier** (e.g. `2.40` means a 100-coin winning bet returns 240 coins total).

**Sources (reputable, refresh before lock)**

| Source | Type | Notes |
|--------|------|-------|
| [Kalshi World Cup markets](https://kalshi.com) | Prediction market probabilities | Match-level “team to advance” / win markets; convert probability `p` to decimal odds `1/p` |
| [Polymarket FIFA markets](https://polymarket.com) | Prediction market | Similar probability → odds conversion |
| [Covers.com World Cup odds](https://www.covers.com/world-cup/odds) | Aggregated bookmaker + market data | Good for cross-check |
| [Odds API](https://the-odds-api.com) (optional) | Licensed sportsbook feed | Paid API; use if automated per-match odds are required |

**Odds policy**
- Store `team_a_odds` and `team_b_odds` on each match record
- Refresh when the matchday opens (midnight) and again **before the daily lock** (first kickoff of the day)
- Display implied probability alongside multiplier: `implied % = (1 / odds) × 100`
- Floor odds at `1.01`, cap at `50.00` to prevent abuse from bad data
- If no market exists yet (early TBD fixtures), show “Odds pending” and disable betting until odds are set

**Payout formula**

```
payout = stake × odds   (winning pick)
payout = 0              (losing pick)
```

Net profit on a win: `stake × (odds - 1)`.

### 3.5 Settlement

After official final result is confirmed:

1. Mark match `finished` with winning team
2. For each locked bet on that match:
   - **Correct:** credit `stake × odds` to user balance
   - **Incorrect:** no refund (stake already deducted)
3. Update user stats: `total_predictions`, `correct_predictions`
4. Idempotent settlement job (safe to re-run)

### 3.6 Leaderboard (Standings)

Public table of all registered members, sortable:

| Column | Description |
|--------|-------------|
| Rank | By coin balance (default) or by accuracy |
| Display name | Public username |
| Coin balance | Current fictional coin stack |
| Correct % | `correct_predictions / total_settled_predictions × 100` |
| Total bets | Number of settled predictions |
| Net profit | Lifetime coins won minus lost (optional) |

Filters: all time, group stage only, knockout only.

---

## 4. User Flows

### New member
```
Land on homepage → Sign up → Receive 10,000 coins → Browse upcoming matches → Pick team + stake → See bet on “My Bets”
```

### Increase stake before daily lock
```
Open match → See existing pick → Move slider higher → Confirm → Balance updated, stake increased
(before first kickoff of the day)
```

### Daily lock
```
First match of the day kicks off → All that day’s bets lock → UI shows “Locked” on today’s slate
```

### Next matchday
```
Midnight Eastern → Betting opens for today’s matches → Users can place new bets
```

### After match
```
Match ends → System settles → Notification/badge → Balance updated → Leaderboard rank changes
```

---

## 5. Pages & UI

| Page | Purpose |
|------|---------|
| **Home** | Hero, next 5 matches, quick link to leaderboard |
| **Matches** | Filter by stage / date; match cards with odds and bet UI |
| **Match detail** | Full info, both teams, user’s bet status, **bets history** (who picked which side and how much) |
| **My Bets** | Open (unlocked) and settled bets |
| **Leaderboard** | Standings table |
| **Profile** | Balance, stats, account settings |
| **Auth** | Login / signup modals or dedicated routes |

**Match card (Polymarket-inspired)**
```
┌─────────────────────────────────────────────────────┐
│  Group D · Match 25 · 15 Jun 18:00 ET               │
│  ┌──────────────┐         ┌──────────────┐          │
│  │  🇺🇸 USA     │   vs    │  🇵🇾 Paraguay │          │
│  │  👍 1.45     │         │  👍 2.80     │          │
│  │  (69%)       │         │  (36%)       │          │
│  └──────────────┘         └──────────────┘          │
│  Betting closes 10:00 ET (first kickoff today)       │
│  Your bet: USA — 500 coins (editable until lock)     │
│  [────────●────────] 500 / 10,000                     │
└─────────────────────────────────────────────────────┘
```

**Visual theme**
- FIFA World Cup 2026 palette: deep green pitch, gold accents, host-nation subtle gradients
- Team flags via [flag CDN](https://flagcdn.com) or FIFA asset guidelines
- Mobile-first; thumb-friendly tap targets

---

## 6. Data Model (Conceptual)

```
User
  id, email, display_name, coin_balance, created_at
  total_predictions, correct_predictions

Match
  id, fifa_match_number, stage, group (nullable)
  team_a_id, team_b_id, kickoff_at, matchday_date (Eastern date)
  venue, city, country
  status, score_a, score_b, winner_team_id (nullable)
  team_a_odds, team_b_odds, odds_locked_at

Matchday (derived or cached)
  matchday_date, first_kickoff_at, betting_opens_at (midnight Eastern)
  betting_closed (bool, set when first kickoff passes)

Team
  id, name, fifa_code, flag_url

Bet
  id, user_id, match_id, picked_team_id
  stake, odds_at_lock, status (open|locked|won|lost)
  created_at, locked_at, settled_at
```

**Ledger (recommended for auditability)**

```
CoinTransaction
  id, user_id, amount (+/-), reason (signup_bonus|bet_placed|bet_increase|payout)
  reference_id (bet_id), created_at
```

---

## 7. Business Rules

| Rule | Detail |
|------|--------|
| Starting balance | 10,000 coins once per account |
| Minimum stake | 1 coin |
| Maximum stake | User’s current balance |
| One pick per match | Cannot bet both teams |
| Stake changes | Increase only; cannot switch team after first bet |
| Betting opens | Midnight Eastern (EST/EDT) on the match’s calendar date |
| Betting closes | First kickoff of that matchday (Eastern) — all that day’s bets lock together |
| Insufficient balance | Block bet with clear error |
| Deleted accounts | Soft-delete; bets remain in historical leaderboard |
| No real money | Prominent disclaimer on every page footer |

---

## 8. Admin & Operations

- **Admin role:** import/update matches, manually set results, trigger settlement, override odds
- **Scheduled jobs (minimal, free-tier friendly):**
  - **Daily at midnight Eastern:** mark matchday open; refresh odds for today’s slate
  - **At first kickoff (or one check near first kickoff):** lock all open bets for that matchday
  - **Once daily (evening):** sync results, settle finished matches
- **Monitoring:** failed settlements, odds fetch failures, balance mismatches, postponed first match of the day

---

## 9. Legal & Compliance

- Fictional currency only — no deposits, withdrawals, or cash value
- Age gate (13+ or 18+ depending on jurisdiction) via signup checkbox
- Terms of Service and Privacy Policy pages
- GDPR: export/delete account data on request
- Do not scrape sites that prohibit it; prefer official APIs and licensed odds feeds

---

## 10. Phased Rollout

| Phase | Scope |
|-------|-------|
| **MVP** | Auth, 10k coins, group-stage matches, bet UI, manual odds entry, manual result settlement, leaderboard |
| **V1** | Automated FIFA schedule sync, automated odds import, auto settlement, email notifications |
| **V2** | OAuth, draw market for group games, head-to-head stats, private leagues |
| **V3** | Live score widget, push notifications, shareable bet cards |

---

## 11. Open Questions

1. Allow switching predicted team before daily lock (currently: no — increases complexity)?
2. Show aggregate “crowd sentiment” (% of coins on each side) like Polymarket?
3. Invite-only leagues vs one global leaderboard?
4. If the first match of the day is postponed, recalculate `first_kickoff_at` and extend the betting window?

---

## 12. Reference Links

- [FIFA World Cup 2026 fixtures & results](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums)
- [FIFA schedule PDF](https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule/_English.pdf)
- [Kalshi World Cup markets](https://kalshi.com)
- [Polymarket 2026 World Cup](https://polymarket.com)
- [Covers.com World Cup odds](https://www.covers.com/world-cup/odds)
