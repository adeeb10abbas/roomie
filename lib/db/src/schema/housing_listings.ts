import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const housingListingsTable = pgTable("housing_listings", {
  id: text("id").primaryKey(),
  type: text("type").$type<"open_room" | "forming_group">().notNull(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),
  rent: integer("rent").notNull(),
  moveInDate: text("move_in_date").notNull(),
  photoIndex: integer("photo_index").notNull().default(0),
  description: text("description").notNull().default(""),
  currentRoommates: integer("current_roommates").notNull().default(0),
  maxRoommates: integer("max_roommates").notNull().default(1),
  rules: jsonb("rules")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  tags: jsonb("tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  amenities: jsonb("amenities")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  sameGenderOnly: boolean("same_gender_only").notNull().default(false),
  postedById: text("posted_by_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type HousingListing = typeof housingListingsTable.$inferSelect;
export type InsertHousingListing = typeof housingListingsTable.$inferInsert;

export const insertHousingListingSchema = createInsertSchema(housingListingsTable, {
  rules: z.array(z.string()),
  tags: z.array(z.string()),
  amenities: z.array(z.string()),
});
