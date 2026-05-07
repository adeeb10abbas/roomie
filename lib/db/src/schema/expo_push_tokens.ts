import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const expoPushTokensTable = pgTable(
  "expo_push_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("expo_push_tokens_user_idx").on(t.userId)],
);

export type ExpoPushToken = typeof expoPushTokensTable.$inferSelect;
export type InsertExpoPushToken = typeof expoPushTokensTable.$inferInsert;
