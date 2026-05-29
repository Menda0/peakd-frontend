import { getApiBase } from "@/lib/api";

export async function fetchPinnedWaveIds(): Promise<string[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/users/me/pinned-waves`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = (await res.json()) as { jobIds?: unknown };
  if (!Array.isArray(raw.jobIds)) return [];
  return raw.jobIds.filter((id): id is string => typeof id === "string");
}

export async function pinWave(jobId: string): Promise<string[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/users/me/pinned-waves/${encodeURIComponent(jobId)}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = (await res.json()) as { jobIds?: unknown };
  if (!Array.isArray(raw.jobIds)) return [];
  return raw.jobIds.filter((id): id is string => typeof id === "string");
}

export async function unpinWave(jobId: string): Promise<string[]> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/users/me/pinned-waves/${encodeURIComponent(jobId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = (await res.json()) as { jobIds?: unknown };
  if (!Array.isArray(raw.jobIds)) return [];
  return raw.jobIds.filter((id): id is string => typeof id === "string");
}
