import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { MonitorService } from "../services/monitor.service";

export const createMonitor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const monitor = await MonitorService.create({ ...req.body, userId });
    res.status(201).json({
      status: "success",
      data: monitor,
    });
  } catch (error) {
    console.error("createMonitor error:", error);
    res.status(400).json({
      status: "fail",
      message: "Invalid data or database error",
    });
  }
};

export const getAllMonitors = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const monitors = await MonitorService.getAllByUserId(userId);
  res.json(monitors);
};
