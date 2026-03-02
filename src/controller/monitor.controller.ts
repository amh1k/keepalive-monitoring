import express, { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const MonitorSchema = z.object({
  name: z.string().min(3),
  url: z.string().url(),
  interval: z.number().min(10).default(60),
  userId: z.string(),
});

export const createMonitor = async (req: Request, res: Response) => {
  try {
    const data = MonitorSchema.parse(req.body);
    const monitor = await prisma.monitor.create({ data });
    res.status(201).json(monitor);
  } catch (error) {
    res.status(400).json({ error: "Invalid data or database error" });
  }
};

export const getAllMonitors = async (req: Request, res: Response) => {
  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(monitors);
};
