import type { Response } from "express";

interface ZodLike<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: unknown[] } };
}

/**
 * Validates the response payload against the given Zod schema before
 * sending it to the client. If validation fails a 500 is returned and the
 * raw validation issues are logged so mismatches between DB data and the
 * declared schema are caught during development.
 */
export function sendValidated<T>(
  res: Response,
  schema: ZodLike<T>,
  data: unknown,
  status = 200,
): void {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.log?.warn(
      { issues: result.error.issues },
      "Response validation failed",
    );
    res.status(500).json({
      error: "Internal data validation error",
      issues: result.error.issues,
    });
    return;
  }
  res.status(status).json(result.data);
}
