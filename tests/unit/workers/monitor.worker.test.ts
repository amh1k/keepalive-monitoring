import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import axios from "axios";
import { prismaMock } from "../../singleton";
import { monitorWorkerProcessor } from "../../../src/workers/monitor.worker";
vi.mock("axios");
const mockedAxios = axios as vi.Mocked<typeof axios>;
describe("Monitor Worker unit tests", () => {
  const mockJob = {
    data: { monitorId: "mon-123" },
  } as any;

  const mockMonitor = {
    id: "mon-123",
    url: "https://example.com",
    timeout: 5000,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // FIX 2: Explicitly reset the axios mock before each test
    mockedAxios.get.mockReset();
  });

  it("should record a successful value when the site is up", async () => {
    prismaMock.monitor.findUnique.mockResolvedValue(mockMonitor as any);
    mockedAxios.get.mockResolvedValue({ status: 200 });
    await monitorWorkerProcessor(mockJob);
    expect(prismaMock.check.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monitorId: "mon-123",
        isUp: true,
        statusCode: 200,
      }),
    });

    expect(prismaMock.monitor.update).toHaveBeenCalledWith({
      where: { id: "mon-123" },
      data: expect.objectContaining({ status: "UP" }),
    });
  });

  it("should record a failed check when the site is DOWN", async () => {
    prismaMock.monitor.findUnique.mockResolvedValue(mockMonitor as any);

    // Mocking a failed response
    mockedAxios.get.mockRejectedValue({
      message: "Timeout",
      response: { status: 504 },
    });

    await monitorWorkerProcessor(mockJob);

    expect(prismaMock.check.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monitorId: "mon-123",
        isUp: false,
        statusCode: 504,
      }),
    });
  });
});
