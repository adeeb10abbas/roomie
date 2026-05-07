import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

/**
 * user1Id is always the lexicographically smaller of the two user IDs
 * (i.e., [user1Id, user2Id].sort() = [user1Id, user2Id]).
 * This canonical ordering is enforced at the application layer in swipes.ts
 * and prevents duplicate match rows under concurrent reciprocal likes.
 */
export const matchesTable = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    user1Id: text("user1_id")
      .notNull()
      .references(() => usersTable.id),
    user2Id: text("user2_id")
      .notNull()
      .references(() => usersTable.id),
    matchedAt: timestamp("matched_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("matches_canonical_pair_idx").on(t.user1Id, t.user2Id),
  ],
);

export type Match = typeof matchesTable.$inferSelect;
export type InsertMatch = typeof matchesTable.$inferInsert;

export const insertMatchSchema = createInsertSchema(matchesTable);
