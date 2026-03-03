import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { MonitorService } from "../services/monitor.service";

export const createMonitor = async (req: Request, res: Response) => {
  try {
    const monitor = await MonitorService.create(req.body);
    res.status(201).json(monitor);
  } catch (error) {
    res.status(400).json({ error: "Invalid data or database error" });
  }
};

export const getAllMonitors = async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const monitors = await MonitorService.getAllByUserId(userId);
  res.json(monitors);
};
