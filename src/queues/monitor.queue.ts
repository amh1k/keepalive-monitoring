import { Queue } from "bullmq";
import { redisConfiguration } from "../lib/redis.js";

export const monitorQueue = new Queue("monitor-pings", {
  connection: redisConfiguration,
});
