import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function requireUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];
  if (!userId || typeof userId !== "string") {
    res.status(401).json({ error: "x-user-id header is required" });
    return;
  }
  req.userId = userId;
  next();
}
