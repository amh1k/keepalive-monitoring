import { it, describe, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { monitorQueue } from "../../src/queues/monitor.queue.js";
import "../../src/workers/monitor.worker.js";
import { notificationQueue } from "../../src/queues/notification.queue.js";
import { httpClient } from "../../src/lib/http.js";
const notificationSpy = vi.spyOn(notificationQueue, "add");
describe("End-to-End Monitoring Flow", () => {
  let authCookies: string[] = [];
  let testMonitorId: string;

  beforeAll(async () => {
    await prisma.check.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
    const userPayload = {
      email: "test@example.com",
      password: "password123",
    };

    await request(app).post("/api/v1/user/register").send(userPayload);

    const loginRes = await request(app).post("/api/v1/user/login").send({
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(loginRes.status).toBe(200);

    authCookies = loginRes.get("Set-Cookie") || [];
    expect(authCookies.length).toBeGreaterThan(0);
  });

  it("should create a monitor, execute a check, and log a result", async () => {
    const monitorData = {
      name: "Test Google Ping",
      url: "https://google.com",
      interval: 60,
      failureThreshold: 3,
    };

    const res = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies)
      .send(monitorData);

    expect(res.status).toBe(201);
    testMonitorId = res.body.data.id;

    await monitorQueue.add(`test-ping-${testMonitorId}`, {
      monitorId: testMonitorId,
    });

    let checkResult = null;
    console.log("Waiting for worker to process check...");

    for (let i = 0; i < 15; i++) {
      checkResult = await prisma.check.findFirst({
        where: { monitorId: testMonitorId },
      });

      if (checkResult) {
        console.log("✅ Worker finished! Check found.");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    expect(checkResult).not.toBeNull();
    expect(checkResult?.isUp).toBe(true);
    expect(checkResult?.statusCode).toBe(200);
    const updatedMonitor = await prisma.monitor.findUnique({
      where: { id: testMonitorId },
    });
    expect(updatedMonitor?.status).toBe("UP");
  }, 40000);

  afterAll(async () => {
    await monitorQueue.obliterate({ force: true });
    await prisma.$disconnect();
  });
  it("should handle a DOWN state, create an incident, and queue a notification", async () => {
    const httpSpy = vi.spyOn(httpClient, "get").mockRejectedValue({
      message: "ENOTFOUND",
      response: { status: 404 },
    });

    const monitorData = {
      name: "Broken Service",
      url: "https://this-url-does-not-exist-123.com",
      interval: 60,
      failureThreshold: 1,
    };

    const res = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies)
      .send(monitorData);
    console.log(res.body);

    const monitorId = res.body.data.id;
    await monitorQueue.add(`test-down-ping-${monitorId}`, { monitorId });
    let incidentRecord = null;
    for (let i = 0; i < 10; i++) {
      incidentRecord = await prisma.incident.findFirst({
        where: { monitorId: monitorId },
      });
      if (incidentRecord) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    expect(incidentRecord).not.toBeNull();
    expect(incidentRecord?.cause).toContain("ENOTFOUND");
    const updatedMonitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    });
    expect(updatedMonitor?.status).toBe("DOWN");
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(`notify-down-${monitorId}`),
      expect.objectContaining({
        status: "DOWN",
        monitorName: "Broken Service",
      }),
    );
    httpSpy.mockRestore();
    notificationSpy.mockClear();
  });
});
