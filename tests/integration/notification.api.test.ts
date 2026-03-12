import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";

describe("Notification api integration test", () => {
  let authCookies: string[];
  let userCreatedId: string;

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.check.deleteMany(),
      prisma.monitor.deleteMany(),
      prisma.notificationChannel.deleteMany(),
      prisma.user.deleteMany(),
    ]);

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
    userCreatedId = registerRes.body.userId;
    await new Promise((resolve) => setTimeout(resolve, 50));
    const loginRes = await request(app)
      .post("/api/v1/user/login")
      .send(testUser);

    if (loginRes.status !== 200) {
      throw new Error("TEST SETUP FAILED: Login failed");
    }

    authCookies = loginRes.get("Set-Cookie") || [];
  });

  it("Should validate, save to db and return 201 for valid Discord webhook", async () => {
    const payload = {
      type: "DISCORD",
      value: "https://discord.com/api/webhooks/12345/abcde",
    };
    const response = await request(app)
      .post("/api/v1/notifications/create-webhook")
      .set("Cookie", authCookies)
      .set("Accept", "application/json")
      .send(payload);

    if (response.status !== 201) {
      console.error("DEBUG Body:", response.body);
    }
    expect(response.status).toBe(201);
    expect(response.body.channel).toHaveProperty("id");
    expect(response.body.channel.type).toBe("DISCORD");
    const savedChannel = await prisma.notificationChannel.findFirst({
      where: { userId: userCreatedId },
    });

    expect(savedChannel).not.toBeNull();
    expect(savedChannel?.value).toBe(payload.value);
  });

  it("Should return 400 for invalid URL format", async () => {
    const payload = {
      type: "DISCORD",
      value: "not-a-valid-url",
    };

    const response = await request(app)
      .post("/api/v1/notifications/create-webhook")
      .set("Cookie", authCookies)
      .send(payload);

    expect(response.status).toBe(400);
  });
  it("Should return 401 if user is not authenticated", async () => {
    const payload = {
      type: "DISCORD",
      value: "https://discord.com/api/webhooks/123",
    };
    const response = await request(app)
      .post("/api/v1/notifications/create-webhook")
      .send(payload);

    expect(response.status).toBe(401);
  });
});
