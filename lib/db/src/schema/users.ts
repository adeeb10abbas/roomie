import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  university: text("university").notNull().default(""),
  isVerified: boolean("is_verified").notNull().default(false),
  bio: text("bio").notNull().default(""),
  photoIndex: integer("photo_index").notNull().default(0),
  occupation: text("occupation").notNull().default(""),
  location: text("location").notNull().default(""),
  neighborhoods: jsonb("neighborhoods")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  budgetMin: integer("budget_min").notNull().default(0),
  budgetMax: integer("budget_max").notNull().default(5000),
  moveInDate: text("move_in_date").notNull().default(""),
  lifestyle: jsonb("lifestyle")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  sameGenderOnly: boolean("same_gender_only").notNull().default(false),
  language: text("language").notNull().default(""),
  religion: text("religion").notNull().default(""),
  prompts: jsonb("prompts")
    .$type<{ question: string; answer: string }[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  tags: jsonb("tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  badges: jsonb("badges")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  matchScore: integer("match_score").notNull().default(0),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export const insertUserSchema = createInsertSchema(usersTable, {
  neighborhoods: z.array(z.string()),
  lifestyle: z.record(z.string(), z.unknown()),
  prompts: z.array(z.object({ question: z.string(), answer: z.string() })),
  tags: z.array(z.string()),
  badges: z.array(z.string()),
});
