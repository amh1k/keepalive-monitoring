import { describe, it, expect, vi } from "vitest";

// 1. Hoist the mock object first
const { mockedPrisma } = vi.hoisted(() => {
  return {
    mockedPrisma: {
      monitor: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

// 2. Define the module mocks
vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: mockedPrisma,
}));

vi.mock("../../../src/queues/monitor.queue", () => ({
  monitorQueue: {
    add: vi.fn(),
  },
}));

// 3. NOW import the service
import { MonitorService } from "../../../src/services/monitor.service";
import { monitorQueue } from "../../../src/queues/monitor.queue";

describe("MonitorService unit tests", () => {
  it("Should create a monitor and return saved object", async () => {
    const monitorInput = {
      name: "Google",
      url: "https://google.com",
      userId: "123",
      interval: 60,
    };

    const mockDbResponse = {
      id: "mon-999",
      ...monitorInput,
      status: "PENDING",
      isActive: true,
    };

    // Use the variable defined in hoisted: mockedPrisma
    mockedPrisma.monitor.create.mockResolvedValue(mockDbResponse as any);

    const result = await MonitorService.create(monitorInput);

    expect(result.id).toBe("mon-999");
    expect(mockedPrisma.monitor.create).toHaveBeenCalled();
    expect(monitorQueue.add).toHaveBeenCalledWith(
      `ping-mon-999`,
      { monitorId: "mon-999" },
      expect.objectContaining({
        repeat: { every: 60000 },
      }),
    );
  });

  it("should throw an error if database creation fails", async () => {
    const errorMessage = "Database connection failed";
    mockedPrisma.monitor.create.mockRejectedValue(new Error(errorMessage));

    await expect(MonitorService.create({} as any)).rejects.toThrow(
      errorMessage,
    );
  });
});
