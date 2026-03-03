import { prisma } from "../lib/prisma.js";
import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import axios from "axios";

export const monitorWorkerProcessor = async (job: any) => {
  const { monitorId } = job.data;

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
};

const worker = new Worker("monitor-pings", monitorWorkerProcessor, {
  connection: redis as any,
});
