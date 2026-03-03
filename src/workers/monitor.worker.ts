import { prisma } from "../lib/prisma.js";
import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import axios from "axios";

const worker = new Worker(
  "monitor-pings",
  async (job) => {
    const { monitorId } = job.data;
    1;
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    });
    if (!monitor) {
      console.error(`Monitor with ID ${monitorId} not found`);
      return;
    }
    const start = Date.now();
    try {
      const response = await axios.get(monitor.url, {
        timeout: monitor?.timeout,
      });
      await prisma.check.create({
        data: {
          monitorId: monitorId,
          statusCode: response.status,
          latency: Date.now() - start,
          isUp: true,
        },
      });
      await prisma.monitor.update({
        where: { id: monitorId },
        data: { status: "UP", lastCheck: new Date() },
      });
    } catch (error: any) {
      await prisma.check.create({
        data: {
          monitorId,
          isUp: false,
          statusCode: error.response?.status || 0,
          latency: Date.now() - start,
          errorMessage: error.message,
        },
      });
    }
  },
  { connection: redis as any },
);
