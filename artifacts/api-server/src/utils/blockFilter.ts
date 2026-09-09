import { db, userBlocksTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select()
    .from(userBlocksTable)
    .where(or(eq(userBlocksTable.blockerId, userId), eq(userBlocksTable.blockedId, userId)));
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  }
  return ids;
}
