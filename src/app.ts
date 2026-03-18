import express from "express";
import cors from "cors";
import monitorRouter from "./routes/monitor.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import notificationRouter from "./routes/notification.route.js";
import statsRouter from "./routes/stats.route.js";
import { redis } from "./lib/redis.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Single limiter — one counter per request, double count impossible
// req.path inside app.use("/api/") is relative e.g. "/v1/user/login"

const SKIP_ROUTES = ["/v1/user/me", "/v1/user/refresh-token"];

const AUTH_ROUTES = ["/v1/user/login", "/v1/user/register"];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    if (AUTH_ROUTES.includes(req.path)) return 20;
    return 100;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  skip: (req) => {
    if (process.env.NODE_ENV === "test") return true;
    return SKIP_ROUTES.includes(req.path);
  },
  store: new RedisStore({
    // @ts-expect-error - ioredis and rate-limit-redis type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});

app.use("/api/", limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/v1/monitor", monitorRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/stats", statsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", async (_req, res) => {
  try {
    await redis.ping();
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      services: { redis: "CONNECTED" },
    });
  } catch (err) {
    res.status(503).json({
      status: "DOWN",
      services: { redis: "DISCONNECTED" },
    });
  }
});

export default app;
