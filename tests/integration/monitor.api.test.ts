import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma.js";
describe("Monitor api integration Test", () => {
  it("POST /api/v1/monitor should create a new monitor in our database", async () => {
    const payload = {
      name: "Uptime Checker",
      url: "https://google.com",
      interval: 60,
      userId: "user-uuid-123",
    };
    const response = await request(app)
      .post("/api/v1/monitor/create")
      .send(payload);
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Uptime Checker");
    const monitorDb = await prisma.monitor.findFirst({
      where: { name: "Uptime checker" },
    });
    expect(monitorDb).not.toBeNull();
    expect(monitorDb?.url).toBe("https://google.com");
  });
  it("POST /api/v1/monitors - should return 400 for invalid URL", async () => {
    const invalidPayload = {
      name: "Bad URL",
      url: "not-a-url",
      interval: 60,
      userId: "123",
    };

    const response = await request(app)
      .post("/api/v1/monitors")
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });
});
