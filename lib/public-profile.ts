import { formatDistanceToNow } from "date-fns";
import type { DiscoverFeedLocation, DiscoverFeedSession } from "@/lib/discover-feed";
import {
  formatLocationLabel,
  formatSessionLocationLabel,
  formatSessionSummary,
  normalizeDiscoverSession,
} from "@/lib/discover-feed";
import { normalizeCurrency } from "@/lib/currencies";
import type { MyVideoItem } from "@/lib/my-videos";
import { myVideoItemToPost } from "@/lib/my-videos";
import { isSurfLevel, type SurfLevel } from "@/lib/user-profile";

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

export type PublicProfileWave = MyVideoItem;

export type PublicProfile = {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  surfLevel: SurfLevel | null;
  countryCode: string | null;
  homeRegionName: string | null;
  pinnedJobIds: string[];
  waves: PublicProfileWave[];
};

function normalizePublicProfileWave(raw: unknown): PublicProfileWave | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const locationRaw = o.location;
  if (!locationRaw || typeof locationRaw !== "object") return null;
  const loc = locationRaw as Record<string, unknown>;
  if (typeof o.jobId !== "string" || typeof o.createdAt !== "string") return null;
  const status = o.status;
  if (status !== "completed") return null;
  const session = normalizeDiscoverSession(o.session);
  if (!session) return null;
  return {
    jobId: o.jobId,
    createdAt: o.createdAt,
    status: "completed",
    thumbnailUrl: typeof o.thumbnailUrl === "string" ? o.thumbnailUrl : null,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : null,
    location: {
      countryCode: typeof loc.countryCode === "string" ? loc.countryCode : "",
      regionName: typeof loc.regionName === "string" ? loc.regionName : "",
      spotName: loc.spotName == null ? null : String(loc.spotName),
      isUndisclosed: loc.isUndisclosed === true,
    },
    session,
    claimStatus:
      o.claimStatus === "auto" || o.claimStatus === "claimed" ? o.claimStatus : "none",
    discoverPublishedAt:
      o.discoverPublishedAt == null ? null : String(o.discoverPublishedAt),
    uploadSource: o.uploadSource === "studio" ? "studio" : "personal",
    surfer: null,
    filmedBy: null,
    isCommercial: o.isCommercial === true,
    snapshotUrls: Array.isArray(o.snapshotUrls)
      ? o.snapshotUrls.filter((u): u is string => typeof u === "string")
      : [],
    videoUnlockedByViewer: o.videoUnlockedByViewer === true,
    currency:
      typeof o.currency === "string" && o.currency.trim()
        ? normalizeCurrency(o.currency)
        : null,
    wavePriceMinor:
      typeof o.wavePriceMinor === "number" ? Math.round(o.wavePriceMinor) : null,
    buyClaimPriceMinor:
      typeof o.buyClaimPriceMinor === "number"
        ? Math.round(o.buyClaimPriceMinor)
        : null,
  };
}

function normalizePublicProfile(raw: unknown): PublicProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.handle !== "string" || !o.handle.trim()) return null;
  const waves: PublicProfileWave[] = [];
  if (Array.isArray(o.waves)) {
    for (const row of o.waves) {
      const wave = normalizePublicProfileWave(row);
      if (wave) waves.push(wave);
    }
  }
  const pinnedJobIds = Array.isArray(o.pinnedJobIds)
    ? o.pinnedJobIds.filter((id): id is string => typeof id === "string")
    : [];
  return {
    handle: o.handle.trim().toLowerCase(),
    displayName: o.displayName == null ? null : String(o.displayName),
    avatarUrl: o.avatarUrl == null ? null : String(o.avatarUrl),
    surfLevel: isSurfLevel(o.surfLevel) ? o.surfLevel : null,
    countryCode: o.countryCode == null ? null : String(o.countryCode),
    homeRegionName: o.homeRegionName == null ? null : String(o.homeRegionName),
    pinnedJobIds,
    waves,
  };
}

export function publicProfilePagePath(handle: string): string {
  const h = handle.trim().replace(/^@+/, "").toLowerCase();
  return `/@${encodeURIComponent(h)}`;
}

export async function fetchPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  const normalized = handle.trim().replace(/^@+/, "").toLowerCase();
  if (!normalized) return null;

  const res = await fetch(
    `${apiBase()}/public/profiles/${encodeURIComponent(normalized)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = (await res.json()) as unknown;
  return normalizePublicProfile(raw);
}

export function publicProfileWaveToPost(
  item: PublicProfileWave,
  profileDisplayName: string | null,
  profileAvatarUrl: string | null,
) {
  const post = myVideoItemToPost(
    {
      ...item,
      surfer: item.surfer ?? {
        userId: "",
        displayName: profileDisplayName,
        avatarUrl: profileAvatarUrl,
        surfLevel: null,
        countryCode: null,
        regionName: null,
      },
    },
    formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
  );
  return {
    ...post,
    authorName: profileDisplayName?.trim() || `@${item.jobId.slice(0, 6)}`,
    authorAvatarUrl: profileAvatarUrl,
  };
}

export function formatProfileLocation(
  countryCode: string | null,
  homeRegionName: string | null,
): string | null {
  const parts: string[] = [];
  if (homeRegionName?.trim()) parts.push(homeRegionName.trim());
  if (countryCode?.trim()) parts.push(countryCode.trim().toUpperCase());
  return parts.length > 0 ? parts.join(", ") : null;
}

export type { DiscoverFeedLocation, DiscoverFeedSession };
