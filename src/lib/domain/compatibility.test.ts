import { describe, expect, it } from "vitest";
import { createNode } from "./factory";
import { validateConnection } from "./compatibility";

describe("connector compatibility", () => {
  it("accepts a client-to-network boundary", () => {
    expect(validateConnection(createNode("browser", "a", "Browser", 0, 0), createNode("api-gateway", "b", "Gateway", 0, 0)).valid).toBe(true);
  });

  it("rejects a direct client-to-data dependency", () => {
    const result = validateConnection(createNode("browser", "a", "Browser", 0, 0), createNode("relational-database", "b", "Database", 0, 0));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/do not normally connect/i);
  });
});
