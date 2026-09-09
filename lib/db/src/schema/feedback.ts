import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const feedbackTable = pgTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  category: text("category")
    .$type<"bug" | "feature" | "general" | "other">()
    .notNull(),
  body: text("body").notNull(),
  appVersion: text("app_version"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
