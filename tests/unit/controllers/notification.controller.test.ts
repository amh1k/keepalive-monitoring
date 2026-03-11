import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../singleton";
import { addNotificationChannel } from "../../../src/controllers/notification.controller";
import { Request, Response } from "express";

vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

describe("Notification controller test", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock = vi.fn();
  let statusMock = vi.fn().mockReturnValue({ json: jsonMock });
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "user-123" } as any,
      body: {
        type: "DISCORD",
        value: "https://discord.com/api/webhooks/12345",
      },
    };

    res = {
      status: statusMock,
    };
  });
  it("Should create a notification channel and return 201", async () => {
    const mockChannel = {
      id: "channel-1",
      type: "DISCORD",
      value: "https://discord.com/api/webhooks/12345",
      userId: "user-123",
      isEnabled: true,
      createdAt: new Date(),
    };

    prismaMock.notificationChannel.create.mockResolvedValue(mockChannel as any);

    await addNotificationChannel(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Notification channel added successfully",
        channel: expect.objectContaining({ id: "channel-1" }),
      }),
    );

    expect(prismaMock.notificationChannel.create).toHaveBeenCalledWith({
      data: {
        type: "DISCORD",
        value: "https://discord.com/api/webhooks/12345",
        userId: "user-123",
        isEnabled: true,
      },
    });
  });

  it("should return 500 if database creation fails", async () => {
    prismaMock.notificationChannel.create.mockRejectedValue(
      new Error("DB Error"),
    );
    await addNotificationChannel(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Failed to add channel",
    });
  });
});
