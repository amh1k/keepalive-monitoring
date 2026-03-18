import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getAllCounts = async (req: Request, res: Response) => {
  const userId = req?.user?.id;
  if (!userId) {
    return res.status(400);
  }
  try {
    const [
      monitorCount,
      notificationChannelCount,
      upDownCount,
      recentAlerts,
      recentAnomalies, // ← new
      anomalyCount,
    ] = await Promise.all([
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
          isUp: false,
        },
        orderBy: { timestamp: "desc" },
        take: 5,
        include: { monitor: { select: { name: true } } },
      }),
      prisma.check.findMany({
        where: {
          monitor: { userId },
          isAnomaly: true,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
          },
        },
        orderBy: { timestamp: "desc" },
        take: 5,
        include: { monitor: { select: { name: true } } },
      }),
      prisma.check.count({
        where: {
          monitor: { userId },
          isAnomaly: true,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);
    return res.status(200).json({
      status: "success",
      data: {
        counts: {
          monitors: monitorCount,
          channels: notificationChannelCount,
          anomalies: anomalyCount,
        },
        monitorStatus: upDownCount,
        alerts: recentAlerts,
        anomalies: recentAnomalies,
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
    const checks = await prisma.check.findMany({
      where: {
        monitor: { userId },
        timestamp: { gte: twentyFourHoursAgo },
      },
      select: {
        timestamp: true,
        latency: true,
        isAnomaly: true, // include so frontend can mark anomaly points red
      },
      orderBy: { timestamp: "asc" },
    });
    const buckets = new Map<
      string,
      { latencies: number[]; hasAnomaly: boolean }
    >();
    checks.forEach(({ timestamp, latency, isAnomaly }) => {
      const min = new Date(timestamp);
      min.setMinutes(Math.floor(min.getMinutes() / 5) * 5, 0, 0);
      const key = min.toISOString();
      if (!buckets.has(key))
        buckets.set(key, { latencies: [], hasAnomaly: false });
      const bucket = buckets.get(key)!;
      bucket.latencies.push(latency);
      if (isAnomaly) bucket.hasAnomaly = true;
    });
    const data = Array.from(buckets.entries()).map(
      ([timestamp, { latencies, hasAnomaly }]) => ({
        timestamp,
        _avg: {
          latency: Math.round(
            latencies.reduce((a, b) => a + b, 0) / latencies.length,
          ),
        },
        hasAnomaly,
      }),
    );
    return res.status(200).json({ status: "success", data });
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
            isUp: true,
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
    return res.status(500).json({
      message: "Failed to calculate uptime percentage for each monitor",
    });
  }
};
