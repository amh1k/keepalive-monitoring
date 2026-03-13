import { prisma } from "../lib/prisma.js";
import { monitorQueue } from "../queues/monitor.queue.js";

export class MonitorService {
  static async create(data: {
    name: string;
    url: string;
    userId: string;
    interval: number;
    failureThreshold?: number;
  }) {
    console.log("Failure threshold is: ", data?.failureThreshold);
    const monitor = await prisma.monitor.create({
      data: {
        ...data,
        failureThreshold: data.failureThreshold ?? 3,
        status: "PENDING",
        isActive: true,
      },
    });
    await monitorQueue.add(
      `ping-${monitor.id}`,
      { monitorId: monitor.id },
      {
        repeat: {
          every: monitor.interval * 1000,
        },
      },
    );
    return monitor;
  }

  static async getAllByUserId(userId: string) {
    return prisma.monitor.findMany({
      where: { userId },
      include: { checks: { take: 10, orderBy: { timestamp: "desc" } } },
    });
  }
}
