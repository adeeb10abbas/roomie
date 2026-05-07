CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"university" text DEFAULT '' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo_index" integer DEFAULT 0 NOT NULL,
	"occupation" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"neighborhoods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"budget_min" integer DEFAULT 0 NOT NULL,
	"budget_max" integer DEFAULT 5000 NOT NULL,
	"move_in_date" text DEFAULT '' NOT NULL,
	"lifestyle" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"same_gender_only" boolean DEFAULT false NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"religion" text DEFAULT '' NOT NULL,
	"prompts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"match_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swipe_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"swiper_id" text NOT NULL,
	"swiped_id" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_swipe" UNIQUE("swiper_id","swiped_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"user1_id" text NOT NULL,
	"user2_id" text NOT NULL,
	"matched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"text" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housing_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"rent" integer NOT NULL,
	"move_in_date" text NOT NULL,
	"photo_index" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"current_roommates" integer DEFAULT 0 NOT NULL,
	"max_roommates" integer DEFAULT 1 NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"same_gender_only" boolean DEFAULT false NOT NULL,
	"posted_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "swipe_actions" ADD CONSTRAINT "swipe_actions_swiper_id_users_id_fk" FOREIGN KEY ("swiper_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_actions" ADD CONSTRAINT "swipe_actions_swiped_id_users_id_fk" FOREIGN KEY ("swiped_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housing_listings" ADD CONSTRAINT "housing_listings_posted_by_id_users_id_fk" FOREIGN KEY ("posted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "matches_canonical_pair_idx" ON "matches" USING btree ("user1_id","user2_id");