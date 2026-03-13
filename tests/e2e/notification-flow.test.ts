import { it, describe, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { monitorQueue } from "../../src/queues/monitor.queue.js";
import { notificationQueue } from "../../src/queues/notification.queue.js";
import { httpClient } from "../../src/lib/http.js";

// 1. START BOTH NERVOUS SYSTEMS
import "../../src/workers/monitor.worker.js";
import "../../src/workers/notification.worker.js";

describe("Complete Alerting Pipeline E2E", () => {
  let authCookies: string[] = [];
  let userId: string;

  beforeAll(async () => {
    // Clean slate
    await prisma.check.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
    await notificationQueue.drain();

    // 2. CREATE USER & GET AUTH
    const userPayload = {
      email: "test@example.com",
      password: "password123",
    };

    await request(app).post("/api/v1/user/register").send(userPayload);

    // Now login to get the cookies
    const loginRes = await request(app).post("/api/v1/user/login").send({
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(loginRes.status).toBe(200);

    // Capture the 'set-cookie' header
    authCookies = loginRes.get("Set-Cookie") || [];
    expect(authCookies.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await monitorQueue.obliterate({ force: true });
    await notificationQueue.obliterate({ force: true });
    await prisma.$disconnect();
  });

  it("should trigger a notification all the way from a failed HTTP ping", async () => {
    const httpSpy = vi.spyOn(httpClient, "get").mockRejectedValue({
      message: "CONNECTION_REFUSED",
      response: { status: 503 },
    });

    const monitorRes = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies)
      .send({
        name: "Urgent API",
        url: "https://critical-service.com",
        interval: 60,
        failureThreshold: 1,
      });

    const monitorId = monitorRes.body.data.id;

    const monitorJob = await monitorQueue.add(`trigger-${monitorId}`, {
      monitorId,
    });
    let completedNotification = false;
    console.log(
      "Waiting for the entire pipeline (Ping -> Incident -> Notify)...",
    );

    for (let i = 0; i < 15; i++) {
      const jobs = await notificationQueue.getJobs(["completed"]);
      const myJob = jobs.find((j) => j.data.monitorName === "Urgent API");

      if (myJob) {
        console.log("✅ Notification Worker successfully processed the alert!");
        expect(myJob.returnvalue).toEqual({ delivered: true });
        completedNotification = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    expect(completedNotification).toBe(true);
    const incident = await prisma.incident.findFirst({ where: { monitorId } });
    expect(incident).not.toBeNull();
    httpSpy.mockRestore();
  }, 45000);
});
