import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../singleton";
import { httpClient } from "../../../src/lib/http.js";
import { notificationWorkerProcessor } from "../../../src/workers/notification.worker";

vi.mock("../../../src/lib/http.js", () => ({
  httpClient: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));
const mockedHttpClient = httpClient as any;
vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

describe("Notification worker unit test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch enabled channels and send Discord notifications", async () => {
    const mockJob = {
      data: {
        monitorName: "Production API",
        status: "DOWN",
        userId: "user-123",
        url: "https://api.example.com",
        incidentId: "incident-999",
      },
    };

    const mockIncident = {
      id: "incident-999",
      error: "Connection Timeout",
      startedAt: new Date(),
    };

    const mockChannels = [
      {
        id: "channel-1",
        type: "DISCORD",
        value: "https://discord.com/webhook/1",
        isEnabled: true,
        userId: "user-123",
      },
    ];

    prismaMock.incident.findUnique.mockResolvedValue(mockIncident as any);
    prismaMock.notificationChannel.findMany.mockResolvedValue(
      mockChannels as any,
    );
    await notificationWorkerProcessor(mockJob as any);

    expect(prismaMock.notificationChannel.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123", isEnabled: true },
    });
    expect(prismaMock.incident.findUnique).toHaveBeenCalledWith({
      where: { id: "incident-999" },
    });

    expect(mockedHttpClient.post).toHaveBeenCalledWith(
      "https://discord.com/webhook/1",
      expect.objectContaining({
        embeds: [
          expect.objectContaining({
            title: "🚨 Monitor Down",
            description: expect.stringContaining("Production API"),
          }),
        ],
      }),
    );
  });

  it("should handle cases where no incidentId is provided", async () => {
    const mockJob = {
      data: {
        monitorName: "Dev Site",
        status: "UP",
        userId: "user-123",
        url: "https://dev.site",
        incidentId: undefined,
      },
    };

    prismaMock.notificationChannel.findMany.mockResolvedValue([
      {
        type: "DISCORD",
        value: "https://discord.com/webhook/1",
        isEnabled: true,
      },
    ] as any);
    await notificationWorkerProcessor(mockJob as any);
    expect(prismaMock.incident.findUnique).not.toHaveBeenCalled();
    expect(mockedHttpClient.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        embeds: [expect.objectContaining({ title: "✅ Monitor Back Up" })],
      }),
    );
  });

  it("should not send notifications if channels are disabled", async () => {
    const mockJob = { data: { userId: "user-123", status: "DOWN" } };
    prismaMock.notificationChannel.findMany.mockResolvedValue([]);
    await notificationWorkerProcessor(mockJob as any);
    expect(mockedHttpClient.post).not.toHaveBeenCalled();
  });
});
