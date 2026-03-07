import { Queue } from "bullmq";
import { redisConfiguration } from "../lib/redis";
export const notificationQueue = new Queue("notification-pings", {
  connection: redisConfiguration,
});
