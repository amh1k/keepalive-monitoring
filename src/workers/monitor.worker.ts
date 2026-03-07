import { prisma } from "../lib/prisma.js";
import { httpClient } from "../lib/http.js";
import { notificationQueue } from "../queues/notification.queue";

export const monitorWorkerProcessor = async (job: any) => {
  const { monitorId } = job.data;
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  });

  if (!monitor || !monitor.isActive) return;

  const start = Date.now();
  let isUp = false;
  let responseData: any;

  try {
    const response = await httpClient.get(monitor.url, {
      timeout: monitor.timeout,
    });
    isUp = response.status >= 200 && response.status < 400;
    responseData = { status: response.status };
  } catch (error: any) {
    isUp = false;
    responseData = {
      status: error.response?.status || 0,
      message: error.message,
    };
  }

  const latency = Date.now() - start;

  // 1. Create the check record first (keeps the transaction lean)
  await prisma.check.create({
    data: {
      monitorId,
      statusCode: responseData.status,
      latency,
      isUp,
      errorMessage: isUp ? null : responseData.message,
    },
  });

  // 2. Handle State Transitions in Transaction
  await prisma.$transaction(async (tx) => {
    if (isUp) {
      if (monitor.status === "DOWN") {
        // RECOVERY LOGIC
        await tx.monitor.update({
          where: { id: monitorId },
          data: { status: "UP", currentFails: 0, lastCheck: new Date() },
        });

        await tx.incident.updateMany({
          where: { monitorId, endedAt: null },
          data: { endedAt: new Date() },
        });

        await notificationQueue.add(`notify-up-${monitorId}`, {
          monitorName: monitor.name,
          status: "RECOVERED",
          userId: monitor.userId,
        });
      } else {
        // Heartbeat update only
        await tx.monitor.update({
          where: { id: monitorId },
          data: { currentFails: 0, status: "UP", lastCheck: new Date() },
        });
      }
    } else {
      const newFailCount = monitor.currentFails + 1;

      // THRESHOLD LOGIC
      if (
        newFailCount >= monitor.failureThreshold &&
        monitor.status !== "DOWN"
      ) {
        // THIS MONITOR IS NOW OFFICIALLY DOWN
        await tx.monitor.update({
          where: { id: monitorId },
          data: {
            status: "DOWN",
            currentFails: newFailCount,
            lastCheck: new Date(),
          },
        });

        const incident = await tx.incident.create({
          data: {
            monitorId,
            startedAt: new Date(),
            cause: responseData.message,
          },
        });

        await notificationQueue.add(`notify-down-${monitorId}`, {
          monitorName: monitor.name,
          status: "DOWN",
          incidentId: incident.id,
          userId: monitor.userId,
        });
      } else {
        await tx.monitor.update({
          where: { id: monitorId },
          data: { currentFails: newFailCount, lastCheck: new Date() },
        });
      }
    }
  });
};
