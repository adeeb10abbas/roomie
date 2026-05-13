import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Each row represents one authentication method for a user.
 * A single user may have multiple rows: one per OAuth provider + one for email/password.
 * email is NOT globally unique — the same email may appear for different providers
 * when a user links OAuth to an existing email/password account.
 * The composite (provider, providerUserId) index ensures no duplicate OAuth logins.
 */
export const authCredentialsTable = pgTable(
  "auth_credentials",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash"),
    provider: text("provider").notNull().default("email"),
    providerUserId: text("provider_user_id"),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Composite unique: one credential row per (provider, providerUserId)
    uniqueIndex("auth_credentials_provider_provider_user_id_idx").on(
      table.provider,
      table.providerUserId,
    ),
    // Non-unique index for email lookups (account linking by email)
    index("auth_credentials_email_idx").on(table.email),
  ],
);

export type AuthCredential = typeof authCredentialsTable.$inferSelect;
export type InsertAuthCredential = typeof authCredentialsTable.$inferInsert;
