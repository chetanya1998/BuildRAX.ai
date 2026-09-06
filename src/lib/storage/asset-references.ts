export const PRIVATE_ASSET_PREFIX = "buildrax-private-asset:";
export const PRIVATE_ASSET_BUCKET = "architecture-assets";

const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const assetPathPattern = new RegExp(`^(${uuidPattern})/(${uuidPattern})/([a-f0-9]{64})\\.(png|jpg|webp|gif|svg)$`);

export type PrivateAssetReference = {
  reference: string;
  path: string;
  workspaceId: string;
  diagramId: string;
  checksum: string;
  extension: string;
};

export function createPrivateAssetReference(path: string) {
  if (!assetPathPattern.test(path)) throw new Error("Private asset path is invalid.");
  return `${PRIVATE_ASSET_PREFIX}${path}`;
}

export function parsePrivateAssetReference(value: string): PrivateAssetReference | null {
  if (!value.startsWith(PRIVATE_ASSET_PREFIX)) return null;
  const path = value.slice(PRIVATE_ASSET_PREFIX.length);
  const match = assetPathPattern.exec(path);
  if (!match) return null;
  return {
    reference: value,
    path,
    workspaceId: match[1],
    diagramId: match[2],
    checksum: match[3],
    extension: match[4],
  };
}

export function privateAssetRenderUrl(value: string, shareToken?: string) {
  const parsed = parsePrivateAssetReference(value);
  if (!parsed) return value;
  const share = shareToken ? `&share=${encodeURIComponent(shareToken)}` : "";
  return `/api/v1/assets/content?ref=${encodeURIComponent(value)}${share}`;
}
