import { it, describe, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { monitorQueue } from "../../src/queues/monitor.queue.js";

// 1. IMPORT THE WORKER: This starts the listener in the Vitest process
import "../../src/workers/monitor.worker.js";

describe("End-to-End Monitoring Flow", () => {
  let authCookies: string[] = [];
  let testMonitorId: string;

  beforeAll(async () => {
    // Clean up DB before test to avoid unique constraint or stale data issues
    await prisma.check.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
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

  it("should create a monitor, execute a check, and log a result", async () => {
    // 3. CREATE MONITOR via API (Passing Cookies)
    const monitorData = {
      name: "Test Google Ping",
      url: "https://google.com",
      interval: 60,
      failureThreshold: 3,
    };

    const res = await request(app)
      .post("/api/v1/monitor/create")
      .set("Cookie", authCookies) // Attach cookies here
      .send(monitorData);

    expect(res.status).toBe(201);
    testMonitorId = res.body.data.id;

    /* 4. TRIGGER IMMEDIATE JOB 
       Bypass the 60s wait for the first repeatable run
    */
    await monitorQueue.add(`test-ping-${testMonitorId}`, {
      monitorId: testMonitorId,
    });

    /* 5. POLLING THE DATABASE */
    let checkResult = null;
    console.log("Waiting for worker to process check...");

    for (let i = 0; i < 15; i++) {
      // Increased attempts for network latency
      checkResult = await prisma.check.findFirst({
        where: { monitorId: testMonitorId },
      });

      if (checkResult) {
        console.log("✅ Worker finished! Check found.");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 6. ASSERTIONS
    expect(checkResult).not.toBeNull();
    expect(checkResult?.isUp).toBe(true);
    expect(checkResult?.statusCode).toBe(200);

    // Verify status update logic
    const updatedMonitor = await prisma.monitor.findUnique({
      where: { id: testMonitorId },
    });
    expect(updatedMonitor?.status).toBe("UP");
  }, 40000); // 40s total timeout

  afterAll(async () => {
    // Clean up Redis and DB
    await monitorQueue.obliterate({ force: true });
    await prisma.$disconnect();
  });
});
