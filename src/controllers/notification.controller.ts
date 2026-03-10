import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export const addNotificationChannel = async (req: Request, res: Response) => {
  try {
    const validatedData = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User context missing" });
    }
    const channel = await prisma.notificationChannel.create({
      data: {
        type: validatedData.type,
        value: validatedData.value,
        userId: userId,
        isEnabled: true,
      },
    });

    return res.status(201).json({
      message: "Notification channel added successfully",
      channel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: (error as any)?.errors,
      });
    }

    console.error("Add Notification Channel Error:", error);
    return res.status(500).json({ message: "Failed to add channel" });
  }
};
