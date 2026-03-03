import { PrismaClient } from "../generated/prisma/client.js";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { prisma } from "../src/lib/prisma.js"; // Point to your real prisma file

vi.mock("../src/lib/prisma.js", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
