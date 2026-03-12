import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getAllCounts = async (req: Request, res: Response) => {
  const userId = req?.user?.id;
  if (!userId) {
    return res.status(400);
  }
  try {
    const [monitorCount, notificationChannelCount, upDownCount, recentAlerts] =
      await Promise.all([
        prisma.monitor.count({ where: { userId } }),
        prisma.notificationChannel.count({ where: { userId } }),
        prisma.monitor.groupBy({
          by: ["status"],
          where: { userId },
          _count: true,
        }),
        prisma.check.findMany({
          where: {
            monitor: { userId },
            statusCode: { gte: 400 },
          },
          orderBy: { timestamp: "desc" },
          take: 5,
          include: { monitor: { select: { name: true } } },
        }),
      ]);
    return res.status(200).json({
      status: "success",
      data: {
        counts: {
          monitors: monitorCount,
          channels: notificationChannelCount,
        },
        monitorStatus: upDownCount,
        alerts: recentAlerts,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Failed to fetch stats of counts" });
  }
};

export const getLatencyTrend = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const latencyData = await prisma.check.groupBy({
      by: ["timestamp"],
      where: {
        monitor: { userId },
        timestamp: { gte: twentyFourHoursAgo },
      },
      _avg: {
        latency: true,
      },
      orderBy: { timestamp: "asc" },
    });
    return res.status(200).json({ status: "success", data: latencyData });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch latency trends" });
  }
};
export const getUptimePercentage = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  try {
    const monitors = await prisma.monitor.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { checks: true },
        },
      },
    });
    const uptimeStats = await Promise.all(
      monitors.map(async (m) => {
        const successfulStats = await prisma.check.count({
          where: {
            monitorId: m.id,
            statusCode: { lte: 400 },
          },
        });
        const total = m._count.checks;
        const percentage = total > 0 ? (successfulStats / total) * 100 : 100;

        return {
          id: m.id,
          name: m.name,
          uptimePercentage: percentage.toFixed(2),
        };
      }),
    );
    return res.status(200).json({ status: "success", data: uptimeStats });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to calculate uptime percentage for each monitor",
      });
  }
};
