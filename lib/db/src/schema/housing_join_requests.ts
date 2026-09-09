import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { housingListingsTable } from "./housing_listings";
import { usersTable } from "./users";

export const housingJoinRequestsTable = pgTable(
  "housing_join_requests",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => housingListingsTable.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    status: text("status")
      .$type<"pending" | "approved" | "denied" | "withdrawn">()
      .notNull()
      .default("pending"),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("housing_join_unique_pending").on(t.listingId, t.requesterId),
    index("housing_join_listing_idx").on(t.listingId),
    index("housing_join_requester_idx").on(t.requesterId),
  ],
);

export type HousingJoinRequest = typeof housingJoinRequestsTable.$inferSelect;
