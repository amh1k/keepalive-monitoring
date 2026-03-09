import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./tests/singleton.ts"],
    environment: "node",
  },
});
// vi.mock("ioredis", () => {
//   const Redis = require("ioredis-mock");
//   return {
//     Redis,
//     default: Redis,
//   };
// });
