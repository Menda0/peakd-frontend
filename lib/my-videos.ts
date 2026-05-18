import { getApiBase } from "@/lib/api";
import type { DiscoverFeedLocation, DiscoverFeedSession } from "@/lib/discover-feed";
import { normalizeDiscoverSession } from "@/lib/discover-feed";

export type MyVideoItem = {
  jobId: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  thumbnailUrl: string | null;
  videoUrl: string | null;
  location: DiscoverFeedLocation;
  session: DiscoverFeedSession;
  claimStatus: "none" | "auto" | "claimed";
  discoverPublishedAt: string | null;
};

function normalizeMyVideoItem(raw: unknown): MyVideoItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const locationRaw = o.location;
  if (!locationRaw || typeof locationRaw !== "object") return null;
  const loc = locationRaw as Record<string, unknown>;
  if (typeof o.jobId !== "string" || typeof o.createdAt !== "string") return null;
  const status = o.status;
  if (status !== "processing" && status !== "completed" && status !== "failed") {
    return null;
  }
  const session = normalizeDiscoverSession(o.session);
  if (!session) return null;
  const claimStatus = o.claimStatus;
  const claim =
    claimStatus === "auto" || claimStatus === "claimed" || claimStatus === "none"
      ? claimStatus
      : "none";
  return {
    jobId: o.jobId,
    createdAt: o.createdAt,
    status,
    thumbnailUrl: typeof o.thumbnailUrl === "string" ? o.thumbnailUrl : null,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : null,
    location: {
      countryCode: typeof loc.countryCode === "string" ? loc.countryCode : "",
      regionName: typeof loc.regionName === "string" ? loc.regionName : "",
      spotName: loc.spotName == null ? null : String(loc.spotName),
      isUndisclosed: loc.isUndisclosed === true,
    },
    session,
    claimStatus: claim,
    discoverPublishedAt:
      o.discoverPublishedAt == null ? null : String(o.discoverPublishedAt),
  };
}

export async function fetchMyVideos(): Promise<MyVideoItem[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/feed/my-videos`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  const items: MyVideoItem[] = [];
  for (const row of raw) {
    const item = normalizeMyVideoItem(row);
    if (item) items.push(item);
  }
  return items;
}
