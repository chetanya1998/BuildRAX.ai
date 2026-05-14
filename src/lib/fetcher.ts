export const fetcher = async (url: string) => {
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || "Failed to load data");
  }

  return payload;
};
