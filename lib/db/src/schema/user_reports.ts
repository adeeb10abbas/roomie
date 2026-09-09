import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userReportsTable = pgTable("user_reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reportedId: text("reported_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  matchId: text("match_id"),
  category: text("category")
    .$type<"harassment" | "spam" | "fake_profile" | "inappropriate" | "safety" | "other">()
    .notNull(),
  description: text("description").notNull().default(""),
  status: text("status")
    .$type<"open" | "reviewing" | "resolved" | "dismissed">()
    .notNull()
    .default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UserReport = typeof userReportsTable.$inferSelect;
