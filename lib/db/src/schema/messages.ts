import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { matchesTable } from "./matches";

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matchesTable.id),
  senderId: text("sender_id").notNull(),
  text: text("text").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;

export const insertMessageSchema = createInsertSchema(messagesTable);
