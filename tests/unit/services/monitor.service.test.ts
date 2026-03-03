import { describe, it, expect, vi } from "vitest";
import { MonitorService } from "../../../src/services/monitor.service";
import { prismaMock } from "../../singleton";
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
      createdAt: new Date(),
      status: "PENDING",
      isActive: true,
      method: "GET",
      timeout: 10000,
      failureThreshold: 3,
      lastCheck: null,
      headers: null,
    };

    prismaMock.monitor.create.mockResolvedValue(mockDbResponse as any);

    const result = await MonitorService.create(monitorInput);
    expect(result.id).toBe("mon-999");
    expect(prismaMock.monitor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: "Google" }),
    });
  });

  it("should throw an error if database creation fails", async () => {
    const errorMessage = "Database connection failed";
    prismaMock.monitor.create.mockRejectedValue(new Error(errorMessage));
    await expect(MonitorService.create({} as any)).rejects.toThrow(
      errorMessage,
    );
  });
});
