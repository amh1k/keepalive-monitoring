import { PrismaClient } from "../generated/prisma/client.js";
// tests/singleton.ts

import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach, vi } from "vitest";

// 1. Create the mock strictly using mockDeep
export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// 2. Clear it before every test to ensure isolation
beforeEach(() => {
  mockReset(prismaMock);
});
