import { describe, expect, it, vi } from "vitest";
import { apiError, SERVICE_UNAVAILABLE_MESSAGE, ServiceUnavailableError } from "./http";

describe("apiError", () => {
  it("shows friendly copy for configuration failures and keeps the detail in server logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = apiError(new ServiceUnavailableError("Persistence is not configured."));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(await response.json()).toEqual({ error: SERVICE_UNAVAILABLE_MESSAGE, code: "service_unavailable" });
    expect(log).toHaveBeenCalledWith("BuildRAX service unavailable", { detail: "Persistence is not configured." });
    log.mockRestore();
  });

  it("maps AI gateway configuration errors to the same response", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const gatewayError = Object.assign(new Error("Missing secure production configuration: RATE_LIMIT_HMAC_SECRET."), { code: "gateway_configuration" });
    const response = apiError(gatewayError);
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toBe(SERVICE_UNAVAILABLE_MESSAGE);
    expect(JSON.stringify(body)).not.toContain("RATE_LIMIT_HMAC_SECRET");
    log.mockRestore();
  });
});
