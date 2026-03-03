import Redis from "ioredis";

export const redisConfiguration = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConfiguration);
