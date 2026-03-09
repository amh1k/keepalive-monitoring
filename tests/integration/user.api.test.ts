import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";

// Mock queues
vi.mock("../../src/queues/monitor.queue", () => ({
  monitorQueue: { add: vi.fn().mockResolvedValue({ id: "job-123" }) },
}));

vi.mock("../../src/queues/notification.queue", () => ({
  notificationQueue: { add: vi.fn() },
}));

describe("Monitor API Integration", () => {
  let authCookies: string[];
  let userCreatedId: string;

  beforeEach(async () => {
    // Reset DB
    await prisma.check.deleteMany();
    await prisma.notificationChannel.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const testUser = {
      email: `test-${Math.random()}@example.com`,
      password: "password123",
    };

    const registerRes = await request(app)
      .post("/api/v1/user/register")
      .send(testUser);

    if (registerRes.status !== 201) {
      throw new Error(
        `TEST SETUP FAILED: Registration failed with status ${registerRes.status}`,
      );
    }

    userCreatedId = registerRes.body.userId;

    // Login user
    const loginRes = await request(app)
      .post("/api/v1/user/login")
      .send(testUser);

    if (loginRes.status !== 200) {
      throw new Error(
        `TEST SETUP FAILED: Login failed with status ${loginRes.status}`,
      );
    }

    authCookies = loginRes.get("Set-Cookie") || [];

    if (authCookies.length === 0) {
      throw new Error("TEST SETUP FAILED: No auth cookies received.");
    }
  });

  it("should validate, save to DB, and return 201 for authenticated user", async () => {
    const payload = {
      name: "Production API",
      url: "https://google.com",
      interval: 60,
    };

    const response = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("id");

    const savedMonitor = await prisma.monitor.findFirst({
      where: { name: "Production API" },
    });

    expect(savedMonitor?.userId).toBe(userCreatedId);
  });

  it("should return 401 when no token is provided", async () => {
    const response = await request(app).post("/api/v1/monitor/create").send({
      name: "Unauthorized",
      url: "https://fail.com",
      interval: 60,
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 when Zod validation fails", async () => {
    const badPayload = {
      name: "S",
      url: "not-a-url",
      interval: 60,
    };

    const response = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies)
      .send(badPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
    expect(response.body.errors).toBeDefined();
  });
});
