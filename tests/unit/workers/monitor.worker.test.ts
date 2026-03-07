import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../singleton";
import { monitorWorkerProcessor } from "../../../src/workers/monitor.worker";
import { httpClient } from "../../../src/lib/http.js";
import { notificationQueue } from "../../../src/queues/notification.queue";

// 1. Mock the HTTP Client (the custom instance used in your worker)
vi.mock("../../../src/lib/http.js", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));
const mockedHttpClient = httpClient as vi.Mocked<typeof httpClient>;

// 2. Mock Prisma (linking it to your singleton mock)
vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

// 3. Mock the Notification Queue
vi.mock("../../../src/queues/notification.queue", () => ({
  notificationQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
}));

describe("Monitor Worker unit tests", () => {
  const mockJob = { data: { monitorId: "mon-123" } } as any;

  const mockMonitor = {
    id: "mon-123",
    url: "https://example.com",
    timeout: 5000,
    isActive: true,
    currentFails: 0,
    failureThreshold: 3,
    status: "UP",
    userId: "user-1",
    name: "Test Monitor",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );
  });

  it("should increment currentFails but not change status on first failure", async () => {
    prismaMock.monitor.findUnique.mockResolvedValue(mockMonitor as any);
    mockedHttpClient.get.mockRejectedValue(new Error("Network Error"));

    await monitorWorkerProcessor(mockJob);
    expect(prismaMock.monitor.update).toHaveBeenCalledWith({
      where: { id: "mon-123" },
      data: expect.objectContaining({
        currentFails: 1,
      }),
    });
    expect(notificationQueue.add).not.toHaveBeenCalled();
  });
  it("should change status to DOWN and create Incident when it reaches the threshold", async () => {
    const failingMonitor = { ...mockMonitor, currentFails: 2 };
    prismaMock.monitor.findUnique.mockResolvedValue(failingMonitor as any);
    mockedHttpClient.get.mockRejectedValue(new Error("Timeout"));
    prismaMock.incident.create.mockResolvedValue({ id: "inc-123" } as any);
    await monitorWorkerProcessor(mockJob);
    expect(prismaMock.monitor.update).toHaveBeenCalledWith({
      where: { id: "mon-123" },
      data: expect.objectContaining({
        status: "DOWN",
        currentFails: 3,
      }),
    });

    expect(prismaMock.incident.create).toHaveBeenCalled();
    expect(notificationQueue.add).toHaveBeenCalledWith(
      expect.stringContaining("notify-down"),
      expect.objectContaining({ status: "DOWN", incidentId: "inc-123" }),
    );
  });

  it("should reset currentFails and close Incident on recovery", async () => {
    const downMonitor = { ...mockMonitor, status: "DOWN", currentFails: 5 };
    prismaMock.monitor.findUnique.mockResolvedValue(downMonitor as any);

    mockedHttpClient.get.mockResolvedValue({ status: 200 } as any);
    await monitorWorkerProcessor(mockJob);
    expect(prismaMock.monitor.update).toHaveBeenCalledWith({
      where: { id: "mon-123" },
      data: expect.objectContaining({
        status: "UP",
        currentFails: 0,
      }),
    });
    expect(prismaMock.incident.updateMany).toHaveBeenCalledWith({
      where: { monitorId: "mon-123", endedAt: null },
      data: { endedAt: expect.any(Date) },
    });
    expect(notificationQueue.add).toHaveBeenCalledWith(
      expect.stringContaining("notify-up"),
      expect.objectContaining({ status: "RECOVERED" }),
    );
  });
});
