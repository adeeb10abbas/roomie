import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const emailVerificationsTable = pgTable(
  "email_verifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    eduEmail: text("edu_email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("email_verifications_user_idx").on(t.userId)],
);

export type EmailVerification = typeof emailVerificationsTable.$inferSelect;
