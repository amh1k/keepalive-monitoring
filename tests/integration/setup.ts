import { beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma.js";

beforeAll(async () => {
  await prisma.$connect;
});

beforeEach(async () => {
  await prisma.check.deleteMany();
  await prisma.monitor.deleteMany();
});
afterAll(async () => {
  await prisma.$disconnect;
});
