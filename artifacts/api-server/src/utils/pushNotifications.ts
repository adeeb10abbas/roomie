import { db, expoPushTokensTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// Expo returns { data: Ticket } for a single message send, { data: Ticket[] } for batch.
// We send single messages, so normalise to always work with the single-object shape.
interface ExpoPushSingleResponse {
  data: ExpoPushTicket;
}

async function processTicket(ticket: ExpoPushTicket, userId: string): Promise<void> {
  if (ticket.status === "error") {
    logger.warn({ userId, error: ticket.message, details: ticket.details }, "Expo push ticket error");

    if (ticket.details?.error === "DeviceNotRegistered") {
      await db
        .delete(expoPushTokensTable)
        .where(eq(expoPushTokensTable.userId, userId));
      logger.info({ userId }, "Removed invalid Expo push token (DeviceNotRegistered)");
    }
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const tokenRow = await db
    .select({
      token: expoPushTokensTable.token,
      notificationsEnabled: usersTable.notificationsEnabled,
    })
    .from(expoPushTokensTable)
    .innerJoin(usersTable, eq(usersTable.id, expoPushTokensTable.userId))
    .where(eq(expoPushTokensTable.userId, userId))
    .limit(1);

  if (tokenRow.length === 0) return;

  const { token, notificationsEnabled } = tokenRow[0];
  if (!notificationsEnabled) return;
  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) return;

  const message: PushMessage = {
    to: token,
    title,
    body,
    data,
    sound: "default",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      logger.warn({ userId, status: response.status }, "Expo push API returned non-200");
      return;
    }

    // Single-message sends return { data: Ticket } (object, not array).
    const result = (await response.json()) as ExpoPushSingleResponse;
    const ticket = result.data;

    if (ticket && typeof ticket === "object" && !Array.isArray(ticket)) {
      await processTicket(ticket, userId);
    } else if (Array.isArray(ticket) && ticket.length > 0) {
      // Guard: handle unexpected array shape gracefully
      await processTicket((ticket as ExpoPushTicket[])[0], userId);
    }
  } catch (err) {
    logger.warn({ userId, err }, "Failed to send push notification");
  }
}
