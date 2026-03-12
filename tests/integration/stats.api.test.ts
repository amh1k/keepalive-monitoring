import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { False } from "../../generated/prisma/internal/prismaNamespace";

describe("Stats API Integration", () => {
  let authCookies: string[];
  let testUserId: string;

  beforeEach(async () => {
    // 1. Clean up to avoid race conditions
    await prisma.check.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
    const testUser = {
      email: `notif-test-${Date.now()}@example.com`,
      password: "password123",
    };
    const registerRes = await request(app)
      .post("/api/v1/user/register")
      .send(testUser);

    if (registerRes.status !== 201) {
      throw new Error("TEST SETUP FAILED: Registration failed");
    }
    testUserId = registerRes.body.userId;
    await new Promise((resolve) => setTimeout(resolve, 50));
    const loginRes = await request(app)
      .post("/api/v1/user/login")
      .send(testUser);

    if (loginRes.status !== 200) {
      throw new Error("TEST SETUP FAILED: Login failed");
    }

    authCookies = loginRes.get("Set-Cookie") || [];
    console.log(authCookies);
  });

  it("Should return 401 if user is not authenticated", async () => {
    const response = await request(app).get("/api/v1/stats/counts");
    expect(response.status).toBe(401);
  });

  it("Should return accurate counts and incident alerts", async () => {
    // Seed: 1 Monitor + 1 Failing Check (Incident)
    const monitor = await prisma.monitor.create({
      data: {
        name: "Test Monitor",
        url: "https://test.com",
        userId: testUserId,
        status: "UP",
      },
    });

    await prisma.check.create({
      data: {
        monitorId: monitor.id,
        statusCode: 500,
        latency: 150,
        timestamp: new Date(),
        isUp: false,
      },
    });

    const response = await request(app)
      .get("/api/v1/stats/counts")
      .set("Cookie", authCookies);

    expect(response.status).toBe(200);
    expect(response.body.data.counts.monitors).toBe(1);
    expect(response.body.data.alerts.length).toBe(1);
    expect(response.body.data.alerts[0].statusCode).toBe(500);
  });

  it("Should calculate uptime percentage correctly", async () => {
    const monitor = await prisma.monitor.create({
      data: {
        name: "Uptime Monitor",
        url: "https://uptime.com",
        userId: testUserId,
      },
    });

    await prisma.check.createMany({
      data: [
        { monitorId: monitor.id, statusCode: 200, latency: 100, isUp: true },
        { monitorId: monitor.id, statusCode: 200, latency: 100, isUp: true },
        { monitorId: monitor.id, statusCode: 200, latency: 100, isUp: true },
        { monitorId: monitor.id, statusCode: 500, latency: 100, isUp: false },
      ],
    });

    const response = await request(app)
      .get("/api/v1/stats/uptime")
      .set("Cookie", authCookies);

    expect(response.status).toBe(200);
    console.log(response.body);
    const monitorStats = response.body.data.find(
      (m: any) => m.id === monitor.id,
    );
    expect(monitorStats.uptimePercentage).toBe("75.00");
  });

  it("Should fetch latency trends for the last 24 hours", async () => {
    const monitor = await prisma.monitor.create({
      data: {
        name: "Latency Test",
        url: "https://latency.com",
        userId: testUserId,
      },
    });

    await prisma.check.create({
      data: {
        monitorId: monitor.id,
        statusCode: 200,
        latency: 250,
        timestamp: new Date(),
        isUp: true,
      },
    });

    const response = await request(app)
      .get("/api/v1/stats/latency")
      .set("Cookie", authCookies);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]._avg.latency).toBe(250);
  });
});
