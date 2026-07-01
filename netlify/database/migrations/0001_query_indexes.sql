CREATE INDEX IF NOT EXISTS "bets_user_id_idx" ON "bets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_match_id_idx" ON "bets" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_status_idx" ON "bets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_matchday_date_idx" ON "matches" USING btree ("matchday_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_kickoff_at_idx" ON "matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coin_transactions_user_id_idx" ON "coin_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coin_transactions_created_at_idx" ON "coin_transactions" USING btree ("created_at");
