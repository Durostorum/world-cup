CREATE TYPE "public"."bet_status" AS ENUM('open', 'locked', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished', 'postponed');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"picked_team_id" uuid NOT NULL,
	"stake" integer NOT NULL,
	"odds_at_lock" numeric(6, 2),
	"status" "bet_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	CONSTRAINT "bets_stake_positive" CHECK ("bets"."stake" > 0)
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchdays" (
	"matchday_date" date PRIMARY KEY NOT NULL,
	"first_kickoff_at" timestamp with time zone NOT NULL,
	"betting_closed" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fifa_match_number" integer NOT NULL,
	"stage" text NOT NULL,
	"group_code" text,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid NOT NULL,
	"kickoff_at" timestamp with time zone NOT NULL,
	"matchday_date" date NOT NULL,
	"venue" text,
	"city" text,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"score_a" integer,
	"score_b" integer,
	"winner_team_id" uuid,
	"team_a_odds" numeric(6, 2),
	"team_b_odds" numeric(6, 2),
	"odds_updated_at" timestamp with time zone,
	CONSTRAINT "matches_fifa_match_number_unique" UNIQUE("fifa_match_number")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"fifa_code" text NOT NULL,
	"flag_url" text,
	CONSTRAINT "teams_fifa_code_unique" UNIQUE("fifa_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"coin_balance" integer DEFAULT 10000 NOT NULL,
	"total_predictions" integer DEFAULT 0 NOT NULL,
	"correct_predictions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_coin_balance_non_negative" CHECK ("users"."coin_balance" >= 0)
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_picked_team_id_teams_id_fk" FOREIGN KEY ("picked_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_date_matchdays_matchday_date_fk" FOREIGN KEY ("matchday_date") REFERENCES "public"."matchdays"("matchday_date") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bets_user_match_unique" ON "bets" USING btree ("user_id","match_id");