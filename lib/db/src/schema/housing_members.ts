import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { housingListingsTable } from "./housing_listings";
import { usersTable } from "./users";

export const housingMembersTable = pgTable(
  "housing_members",
  {
    listingId: text("listing_id")
      .notNull()
      .references(() => housingListingsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").$type<"owner" | "member">().notNull(),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.listingId, t.userId] })],
);

export type HousingMember = typeof housingMembersTable.$inferSelect;
