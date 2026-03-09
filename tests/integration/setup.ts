import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import { beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma.js";

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.check.deleteMany();
  await prisma.notificationChannel.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
