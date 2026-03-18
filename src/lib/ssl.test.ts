import { describe, it, expect } from "vitest";
import { checkSslDetails } from "./ssl";

describe("SSL Check Logic", () => {
  it("should return VALID for a reputable HTTPS site", async () => {
    const result = await checkSslDetails("https://google.com");
    expect(result.status).toBe("VALID");
    expect(result.expirationDate).toBeInstanceOf(Date);
    expect(result.issuer).toBeDefined();
  }, 10000);

  it("should return INVALID for an HTTP site", async () => {
    const result = await checkSslDetails("http://example.com");
    expect(result.status).toBe("INVALID");
    expect(result.expirationDate).toBeNull();
  });

  it("should return INVALID for a non-existent domain", async () => {
    const result = await checkSslDetails("https://non-existent-domain-123456789.com");
    expect(result.status).toBe("INVALID");
  });
});
