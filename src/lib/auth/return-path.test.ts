import { describe, expect, it } from "vitest";
import { safeAuthReturnPath, signInPath } from "./return-path";

describe("authentication return paths", () => {
  it("preserves an internal canvas destination and its migration marker", () => {
    expect(safeAuthReturnPath("/draft/abc?migrate=1")).toBe("/draft/abc?migrate=1");
    expect(signInPath("/projects/project-one/canvas")).toBe("/sign-in?next=%2Fprojects%2Fproject-one%2Fcanvas");
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", "/auth/callback?code=x"])(
    "rejects unsafe or recursive destination %s",
    (value) => expect(safeAuthReturnPath(value)).toBe("/dashboard"),
  );
});
