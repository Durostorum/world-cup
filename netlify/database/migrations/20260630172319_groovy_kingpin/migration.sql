CREATE TYPE "bet_status" AS ENUM('open', 'locked', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "match_status" AS ENUM('scheduled', 'live', 'finished', 'postponed');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"picked_team_id" uuid NOT NULL,
	"stake" integer NOT NULL,
	"odds_at_lock" numeric(6,2),
	"status" "bet_status" DEFAULT 'open'::"bet_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchdays" (
	"matchday_date" date PRIMARY KEY,
	"first_kickoff_at" timestamp with time zone NOT NULL,
	"betting_closed" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"fifa_match_number" integer NOT NULL UNIQUE,
	"stage" text NOT NULL,
	"group_code" text,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid NOT NULL,
	"kickoff_at" timestamp with time zone NOT NULL,
	"matchday_date" date NOT NULL,
	"venue" text,
	"city" text,
	"status" "match_status" DEFAULT 'scheduled'::"match_status" NOT NULL,
	"score_a" integer,
	"score_b" integer,
	"winner_team_id" uuid,
	"team_a_odds" numeric(6,2),
	"team_b_odds" numeric(6,2),
	"odds_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"fifa_code" text NOT NULL UNIQUE,
	"flag_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"coin_balance" integer DEFAULT 10000 NOT NULL,
	"total_predictions" integer DEFAULT 0 NOT NULL,
	"correct_predictions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_match_id_matches_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id");--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_picked_team_id_teams_id_fkey" FOREIGN KEY ("picked_team_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_date_matchdays_matchday_date_fkey" FOREIGN KEY ("matchday_date") REFERENCES "matchdays"("matchday_date");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id");