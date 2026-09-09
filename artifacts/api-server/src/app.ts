import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

/**
 * Build the CORS origin allowlist from the environment.
 *
 * CORS_ALLOWED_ORIGINS (comma-separated) overrides the defaults when set, e.g.:
 *   CORS_ALLOWED_ORIGINS=https://myapp.com,https://staging.myapp.com
 *
 * Defaults cover Replit preview domains and localhost for development.
 * All patterns are anchored (no substring matches) to prevent tricks like
 * "evil-replit.dev.attacker.com".
 */
function buildCorsOriginCheck() {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins) {
    const explicit = envOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (explicit.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    };
  }

  // Default: Replit preview domains + localhost (anchored regex)
  const DEFAULT_ALLOWED =
    /^https?:\/\/(localhost(:\d+)?|[\w.-]+\.replit\.dev)$/;
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (DEFAULT_ALLOWED.test(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  };
}

app.use(
  cors({
    origin: buildCorsOriginCheck(),
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
