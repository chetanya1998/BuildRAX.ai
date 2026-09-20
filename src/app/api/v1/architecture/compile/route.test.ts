import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/architecture/compile", () => {
  it("returns validated IR and a compiled diagram", async () => {
    const response = await POST(new Request("http://localhost/api/v1/architecture/compile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-buildrax-anonymous-session": "ir-test-success" },
      body: JSON.stringify({ prompt: "Build an event-driven platform for order processing." }),
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.meta.strategy).toBe("deterministic-ir");
    expect(body.validation.valid).toBe(true);
    expect(body.ir.schemaVersion).toBe("1.1.0");
    expect(body.presentation.schemaVersion).toBe("1.0.0");
    expect(body.checksums.ir).toHaveLength(64);
    expect(body.diagram.nodes.length).toBeGreaterThanOrEqual(6);
  });

  it("rejects invalid untrusted input", async () => {
    const response = await POST(new Request("http://localhost/api/v1/architecture/compile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-buildrax-anonymous-session": "ir-test-invalid" },
      body: JSON.stringify({ prompt: "<script>bad</script>" }),
    }));
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body).toMatchObject({ stage: "input-validation" });
    expect(body.fieldErrors.prompt).toBeDefined();
  });

  it("accepts the maximum description and reports unsupported structured input by field", async () => {
    const accepted = await POST(new Request("http://localhost/api/v1/architecture/compile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-buildrax-anonymous-session": "ir-test-long" },
      body: JSON.stringify({ prompt: "a".repeat(3000), tenancy: "single-tenant", dataSensitivity: "internal" }),
    }));
    const acceptedBody = await accepted.json();
    expect(accepted.status).toBe(200);
    expect(acceptedBody.ir.requirements.functional.every((item: string) => item.length <= 240)).toBe(true);

    const rejected = await POST(new Request("http://localhost/api/v1/architecture/compile", {
      method: "POST",
      headers: { "content-type": "application/json", "x-buildrax-anonymous-session": "ir-test-unsupported" },
      body: JSON.stringify({ prompt: "Build a useful order-processing platform.", tenancy: "shared-sometimes" }),
    }));
    const rejectedBody = await rejected.json();
    expect(rejected.status).toBe(422);
    expect(rejectedBody.stage).toBe("input-validation");
    expect(rejectedBody.fieldErrors.tenancy[0]).toMatch(/Invalid option/i);
  });
});
