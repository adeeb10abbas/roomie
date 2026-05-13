ALTER TABLE "auth_credentials" DROP CONSTRAINT "auth_credentials_email_unique";--> statement-breakpoint
CREATE INDEX "auth_credentials_email_idx" ON "auth_credentials" USING btree ("email");