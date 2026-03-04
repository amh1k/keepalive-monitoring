import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";

vi.mock("../../src/queues/monitor.queue", () => ({
  monitorQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
}));

describe("Monitor API Integration", () => {
  let activeUserId: string;

  beforeEach(async () => {
    await prisma.check.deleteMany();
    await prisma.notificationChannel.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: "hashed_password",
      },
    });
    activeUserId = user.id;
  });
  it("should validate, save to DB, and return 201", async () => {
    const payload = {
      name: "Production API",
      url: "https://google.com",
      interval: 60,
      userId: activeUserId,
    };

    const response = await request(app)
      .post("/api/v1/monitor/create")
      .send(payload);
    if (response.status !== 201) {
      console.log("Validation Error:", response.body);
    }
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.name).toBe("Production API");
    const savedMonitor = await prisma.monitor.findFirst({
      where: { name: "Production API" },
    });
    expect(savedMonitor).not.toBeNull();
    expect(savedMonitor?.url).toBe("https://google.com");
  });

  it("should return 400 when Zod validation fails", async () => {
    const badPayload = {
      name: "Short",
      url: "not-a-url",
      interval: -5,
    };

    const response = await request(app)
      .post("/api/v1/monitor/create")
      .send(badPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
    expect(response.body.errors).toBeDefined();
  });
});
