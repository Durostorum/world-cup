import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
  'postponed',
])

export const betStatusEnum = pgEnum('bet_status', ['open', 'locked', 'won', 'lost'])

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    coinBalance: integer('coin_balance').notNull().default(10000),
    totalPredictions: integer('total_predictions').notNull().default(0),
    correctPredictions: integer('correct_predictions').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('users_email_unique').on(table.email),
    check('users_coin_balance_non_negative', sql`${table.coinBalance} >= 0`),
  ],
)

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  fifaCode: text('fifa_code').notNull().unique(),
  flagUrl: text('flag_url'),
})

export const matchdays = pgTable('matchdays', {
  matchdayDate: date('matchday_date').primaryKey(),
  firstKickoffAt: timestamp('first_kickoff_at', { withTimezone: true }).notNull(),
  bettingClosed: boolean('betting_closed').notNull().default(false),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fifaMatchNumber: integer('fifa_match_number').notNull().unique(),
  stage: text('stage').notNull(),
  groupCode: text('group_code'),
  teamAId: uuid('team_a_id')
    .references(() => teams.id)
    .notNull(),
  teamBId: uuid('team_b_id')
    .references(() => teams.id)
    .notNull(),
  kickoffAt: timestamp('kickoff_at', { withTimezone: true }).notNull(),
  matchdayDate: date('matchday_date')
    .references(() => matchdays.matchdayDate)
    .notNull(),
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

export const bets = pgTable(
  'bets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    matchId: uuid('match_id')
      .references(() => matches.id)
      .notNull(),
    pickedTeamId: uuid('picked_team_id')
      .references(() => teams.id)
      .notNull(),
    stake: integer('stake').notNull(),
    oddsAtLock: numeric('odds_at_lock', { precision: 6, scale: 2 }),
    status: betStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    settledAt: timestamp('settled_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('bets_user_match_unique').on(table.userId, table.matchId),
    check('bets_stake_positive', sql`${table.stake} > 0`),
  ],
)

export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type Team = typeof teams.$inferSelect
export type Match = typeof matches.$inferSelect
export type Bet = typeof bets.$inferSelect
