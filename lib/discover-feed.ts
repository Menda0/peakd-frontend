import { getApiBase } from "@/lib/api";
import { englishCountryLabel } from "@/lib/countries";
import { normalizeSurferProfile, type SurferProfile } from "@/lib/surfer-profile";

export type DiscoverFeedAuthor = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPartner: boolean;
};

export type DiscoverFeedLocation = {
  countryCode: string;
  regionName: string;
  spotName: string | null;
  isUndisclosed: boolean;
};

export type DiscoverFeedSession = {
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: string[];
};

export type DiscoverFeedItem = {
  jobId: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  author: DiscoverFeedAuthor;
  location: DiscoverFeedLocation;
  session: DiscoverFeedSession;
  shakaCount: number;
  followedByViewer: boolean;
  claimStatus: "none" | "auto" | "claimed";
  uploadSource: "studio" | "personal";
  claimedByViewer: boolean;
  isOwnUpload: boolean;
  surfer: SurferProfile | null;
  isCommercial: boolean;
  snapshotUrls: string[];
  videoUnlockedByViewer: boolean;
  wavePricePeaks: number | null;
  buyClaimPricePeaks: number | null;
  sponsorPricePeaks: number | null;
  canClaim: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
};

export type DiscoverFeedPage = {
  items: DiscoverFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type DiscoverFeedPost = {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  isPartnerUpload: boolean;
  location: string;
  sessionSummary: string;
  timeAgo: string;
  createdAt: string;
  session: DiscoverFeedSession;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  snapshotUrls: string[];
  status: "processing" | "completed" | "failed";
  claimStatus: "none" | "auto" | "claimed";
  claimedByViewer: boolean;
  isOwnUpload: boolean;
  surfer: SurferProfile | null;
  likes: number;
  comments: number;
  shares: number;
  isCommercial: boolean;
  videoUnlockedByViewer: boolean;
  wavePricePeaks: number | null;
  buyClaimPricePeaks: number | null;
  sponsorPricePeaks: number | null;
  canClaim: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
};

export const PERSONAL_UPLOAD_EVENT = "peakd:personal-upload";
export const COMMERCIAL_WAVE_UNLOCKED_EVENT = "peakd:commercial-wave-unlocked";

export function formatLocationLabel(location: DiscoverFeedLocation): string {
  const country = englishCountryLabel(location.countryCode) ?? location.countryCode;
  if (location.isUndisclosed) {
    return `${location.regionName}, ${country}`;
  }
  if (location.spotName) {
    return `${location.spotName}, ${location.regionName}`;
  }
  return `${location.regionName}, ${country}`;
}

/** Spot and region for the session line below the video (e.g. "Morena, Costa da Caparica"). */
export function formatSessionLocationLabel(location: DiscoverFeedLocation): string {
  const spot = location.spotName?.trim();
  const region = location.regionName?.trim();
  if (spot && region) return `${spot}, ${region}`;
  if (spot) return spot;
  if (region) return region;
  return formatLocationLabel(location);
}

export function formatSessionTimeRange(
  sessionTime: string,
  durationMinutes: number,
): string {
  const match = /^(\d{2}):(\d{2})$/.exec(sessionTime.trim());
  if (!match) return sessionTime;
  const startTotal = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const endTotal = (startTotal + durationMinutes) % (24 * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (total: number) =>
    `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  return `${fmt(startTotal)}-${fmt(endTotal)}`;
}

export function formatSessionSummary(
  location: DiscoverFeedLocation,
  session: DiscoverFeedSession,
): string {
  const place = formatSessionLocationLabel(location);
  const timeRange = formatSessionTimeRange(session.sessionTime, session.durationMinutes);
  return `${place} · ${session.sessionDate} · ${timeRange}`;
}

export function discoverItemToPost(
  item: DiscoverFeedItem,
  timeAgo: string,
): DiscoverFeedPost {
  const authorName = item.author.displayName?.trim() || "Surfer";
  return {
    id: item.jobId,
    authorName,
    authorAvatarUrl: item.author.avatarUrl,
    isPartnerUpload: item.uploadSource === "studio",
    location: formatLocationLabel(item.location),
    sessionSummary: formatSessionSummary(item.location, item.session),
    timeAgo,
    createdAt: item.createdAt,
    session: item.session,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl,
    status: item.status,
    claimStatus: item.claimStatus,
    claimedByViewer: item.claimedByViewer,
    isOwnUpload: item.isOwnUpload,
    surfer: item.surfer,
    likes: item.shakaCount,
    comments: 0,
    shares: 0,
    isCommercial: item.isCommercial,
    snapshotUrls: item.snapshotUrls,
    videoUnlockedByViewer: item.videoUnlockedByViewer,
    wavePricePeaks: item.wavePricePeaks,
    buyClaimPricePeaks: item.buyClaimPricePeaks,
    sponsorPricePeaks: item.sponsorPricePeaks,
    canClaim: item.canClaim,
    canBuyClaim: item.canBuyClaim,
    canSponsor: item.canSponsor,
  };
}

export function normalizeDiscoverSession(raw: unknown): DiscoverFeedSession | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.sessionDate !== "string") return null;
  const rating = s.conditionsRating;
  const conditionsRating =
    typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : null;
  const waveTypes = Array.isArray(s.waveTypes)
    ? s.waveTypes.filter((w): w is string => typeof w === "string")
    : [];
  return {
    sessionDate: s.sessionDate,
    sessionTime: typeof s.sessionTime === "string" ? s.sessionTime : "12:00",
    durationMinutes:
      typeof s.durationMinutes === "number" && s.durationMinutes >= 15
        ? s.durationMinutes
        : 120,
    conditionsRating,
    waveTypes,
  };
}

function normalizeDiscoverItem(raw: unknown): DiscoverFeedItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const authorRaw = o.author;
  if (!authorRaw || typeof authorRaw !== "object") return null;
  const a = authorRaw as Record<string, unknown>;
  const locationRaw = o.location;
  if (!locationRaw || typeof locationRaw !== "object") return null;
  const loc = locationRaw as Record<string, unknown>;
  if (typeof o.jobId !== "string" || typeof o.createdAt !== "string") return null;
  const status = o.status;
  if (status !== "processing" && status !== "completed" && status !== "failed") {
    return null;
  }
  const claimStatus = o.claimStatus;
  const claim =
    claimStatus === "auto" || claimStatus === "claimed" || claimStatus === "none"
      ? claimStatus
      : "none";
  const uploadSource = o.uploadSource === "personal" ? "personal" : "studio";
  const session = normalizeDiscoverSession(o.session);
  if (!session) return null;
  return {
    jobId: o.jobId,
    createdAt: o.createdAt,
    status,
    videoUrl: o.videoUrl == null ? null : String(o.videoUrl),
    thumbnailUrl: typeof o.thumbnailUrl === "string" ? o.thumbnailUrl : null,
    author: {
      userId: typeof a.userId === "string" ? a.userId : "",
      displayName: a.displayName == null ? null : String(a.displayName),
      avatarUrl: a.avatarUrl == null ? null : String(a.avatarUrl),
      isPartner: a.isPartner === true,
    },
    location: {
      countryCode: typeof loc.countryCode === "string" ? loc.countryCode : "",
      regionName: typeof loc.regionName === "string" ? loc.regionName : "",
      spotName: loc.spotName == null ? null : String(loc.spotName),
      isUndisclosed: loc.isUndisclosed === true,
    },
    session,
    shakaCount: typeof o.shakaCount === "number" ? o.shakaCount : 0,
    followedByViewer: o.followedByViewer === true,
    claimStatus: claim,
    uploadSource,
    claimedByViewer: o.claimedByViewer === true,
    isOwnUpload: o.isOwnUpload === true,
    surfer: normalizeSurferProfile(o.surfer),
    isCommercial: o.isCommercial === true,
    snapshotUrls: Array.isArray(o.snapshotUrls)
      ? o.snapshotUrls.filter((u): u is string => typeof u === "string")
      : [],
    videoUnlockedByViewer: o.videoUnlockedByViewer === true,
    wavePricePeaks:
      typeof o.wavePricePeaks === "number" ? o.wavePricePeaks : null,
    buyClaimPricePeaks:
      typeof o.buyClaimPricePeaks === "number" ? o.buyClaimPricePeaks : null,
    sponsorPricePeaks:
      typeof o.sponsorPricePeaks === "number" ? o.sponsorPricePeaks : null,
    canClaim: o.canClaim === true,
    canBuyClaim: o.canBuyClaim === true,
    canSponsor: o.canSponsor === true,
  };
}

export function normalizeDiscoverFeedPage(raw: unknown): DiscoverFeedPage | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const items: DiscoverFeedItem[] = [];
  for (const row of o.items) {
    const item = normalizeDiscoverItem(row);
    if (item) items.push(item);
  }
  return {
    items,
    nextCursor: o.nextCursor == null ? null : String(o.nextCursor),
    hasMore: o.hasMore === true,
  };
}

export async function fetchDiscoverFeed(options?: {
  cursor?: string | null;
  limit?: number;
  countryCode?: string | null;
  regionId?: string | null;
}): Promise<DiscoverFeedPage> {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.cursor?.trim()) params.set("cursor", options.cursor.trim());
  if (options?.countryCode?.trim()) {
    params.set("countryCode", options.countryCode.trim().toUpperCase());
  }
  if (options?.regionId?.trim()) {
    params.set("regionId", options.regionId.trim());
  }
  const qs = params.toString();
  const res = await fetch(`${base}/feed/discover${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const page = normalizeDiscoverFeedPage(await res.json());
  if (!page) {
    throw new Error("Invalid discover feed response");
  }
  return page;
}

export async function publishVideoToDiscover(jobId: string): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}/discover/videos/${encodeURIComponent(jobId)}/publish`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
}
