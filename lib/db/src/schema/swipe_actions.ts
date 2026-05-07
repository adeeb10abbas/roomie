import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const swipeActionsTable = pgTable(
  "swipe_actions",
  {
    id: text("id").primaryKey(),
    swiperId: text("swiper_id")
      .notNull()
      .references(() => usersTable.id),
    swipedId: text("swiped_id")
      .notNull()
      .references(() => usersTable.id),
    action: text("action").$type<"like" | "skip" | "shortlist">().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("unique_swipe").on(t.swiperId, t.swipedId)],
);

export type SwipeAction = typeof swipeActionsTable.$inferSelect;
export type InsertSwipeAction = typeof swipeActionsTable.$inferInsert;

export const insertSwipeActionSchema = createInsertSchema(swipeActionsTable);
