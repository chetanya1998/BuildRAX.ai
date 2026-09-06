import { describe, expect, it } from "vitest";
import { createPrivateAssetReference, parsePrivateAssetReference, privateAssetRenderUrl } from "./asset-references";

const path = "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png";

describe("private asset references", () => {
  it("round-trips a scoped content-addressed path", () => {
    const reference = createPrivateAssetReference(path);
    expect(parsePrivateAssetReference(reference)).toMatchObject({
      path,
      workspaceId: "11111111-1111-4111-8111-111111111111",
      diagramId: "22222222-2222-4222-8222-222222222222",
      checksum: "a".repeat(64),
      extension: "png",
    });
    expect(privateAssetRenderUrl(reference)).toContain(encodeURIComponent(reference));
  });

  it("rejects paths that can escape the assigned workspace and diagram", () => {
    expect(parsePrivateAssetReference("buildrax-private-asset:../../secret.png")).toBeNull();
    expect(() => createPrivateAssetReference("invalid/path.svg")).toThrow("invalid");
  });
});
