import { getApiBase } from "@/lib/api";

export type PublicSharedSessionWave = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  thumbnailUrls: string[];
  videoUrl: string;
};

export type PublicSharedSession = {
  partnerName: string | null;
  partnerAvatarUrl: string | null;
  session: {
    sessionDate: string;
    sessionTime: string;
    durationMinutes: number;
    conditionsRating: number | null;
    waveTypes: string[];
    countryCode: string;
    regionName: string;
    spotName: string | null;
    isUndisclosed: boolean;
  };
  waves: PublicSharedSessionWave[];
};

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

export function sharedSessionPagePath(shareToken: string): string {
  return `/share/sessions/${encodeURIComponent(shareToken)}`;
}

export function absoluteSharedSessionUrl(
  origin: string,
  shareToken: string,
): string {
  return `${origin.replace(/\/+$/, "")}${sharedSessionPagePath(shareToken)}`;
}

export async function fetchPublicSharedSession(
  shareToken: string,
): Promise<PublicSharedSession | null> {
  const token = shareToken.trim();
  if (!token) return null;

  const res = await fetch(
    `${apiBase()}/public/shared-sessions/${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  return (await res.json()) as PublicSharedSession;
}

export async function ensureSessionShareToken(
  sessionId: string,
): Promise<string> {
  const res = await fetch(`${getApiBase()}/studio/sessions/${sessionId}/share`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = (await res.json()) as { shareToken?: string };
  if (typeof data.shareToken !== "string" || !data.shareToken.trim()) {
    throw new Error("Invalid share response");
  }
  return data.shareToken.trim();
}
