import { afterEach, describe, expect, it, vi } from "vitest";
import { createGenerationReceipt, verifyGenerationReceipt } from "./generation-receipt";

const input = {
  requestId: "11111111-1111-4111-8111-111111111111",
  irChecksum: "a".repeat(64),
  diagramChecksum: "b".repeat(64),
};

afterEach(() => vi.unstubAllEnvs());

describe("generation receipts", () => {
  it("fails closed in production without a dedicated signing secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GENERATION_RECEIPT_SECRET", "");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "r".repeat(32));
    expect(() => createGenerationReceipt(input)).toThrow("GENERATION_RECEIPT_SECRET");
  });

  it("creates and verifies a receipt with the configured secret", () => {
    vi.stubEnv("GENERATION_RECEIPT_SECRET", "g".repeat(32));
    const receipt = createGenerationReceipt(input);
    expect(verifyGenerationReceipt(receipt, { ir: input.irChecksum, diagram: input.diagramChecksum })).toEqual(receipt);
  });
});
