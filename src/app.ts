import express, { Request, Response } from "express";
import cors from "cors";
import monitorRouter from "./routes/monitor.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import notificationRouter from "./routes/notification.route.js";
import statsRouter from "./routes/stats.route.js";
import { redisConfiguration } from "./lib/redis.js";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./lib/redis.js";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 10000 : 100, // Higher limit for tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  store: new RedisStore({
    // @ts-expect-error - ioredis and rate-limit-redis type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});
app.use("/api/", globalLimiter);
app.use("/api/v1/monitor", monitorRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/stats", statsRouter);

app.get("/health", async (_req, res) => {
  try {
    // Check if Redis is alive
    await redis.ping();
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      services: { redis: "CONNECTED" },
    });
  } catch (err) {
    res
      .status(503)
      .json({ status: "DOWN", services: { redis: "DISCONNECTED" } });
  }
});

export default app;
