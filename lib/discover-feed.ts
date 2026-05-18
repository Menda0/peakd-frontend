import { getApiBase } from "@/lib/api";
import { englishCountryLabel } from "@/lib/countries";

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

export type DiscoverFeedItem = {
  jobId: string;
  createdAt: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
  author: DiscoverFeedAuthor;
  location: DiscoverFeedLocation;
  shakaCount: number;
  followedByViewer: boolean;
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
  verified: boolean;
  location: string;
  timeAgo: string;
  createdAt: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
};

function formatLocationLabel(location: DiscoverFeedLocation): string {
  const country = englishCountryLabel(location.countryCode) ?? location.countryCode;
  if (location.isUndisclosed) {
    return `${location.regionName}, ${country}`;
  }
  if (location.spotName) {
    return `${location.spotName}, ${location.regionName}`;
  }
  return `${location.regionName}, ${country}`;
}

export function discoverItemToPost(
  item: DiscoverFeedItem,
  timeAgo: string,
): DiscoverFeedPost {
  const authorName =
    item.author.displayName?.trim() || "Surfer";
  return {
    id: item.jobId,
    authorName,
    authorAvatarUrl: item.author.avatarUrl,
    verified: item.author.isPartner,
    location: formatLocationLabel(item.location),
    timeAgo,
    createdAt: item.createdAt,
    title: item.title,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl,
    likes: item.shakaCount,
    comments: 0,
    shares: 0,
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
  if (typeof o.videoUrl !== "string") return null;
  return {
    jobId: o.jobId,
    createdAt: o.createdAt,
    videoUrl: o.videoUrl,
    thumbnailUrl: typeof o.thumbnailUrl === "string" ? o.thumbnailUrl : null,
    title: typeof o.title === "string" ? o.title : "Surf video",
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
    shakaCount: typeof o.shakaCount === "number" ? o.shakaCount : 0,
    followedByViewer: o.followedByViewer === true,
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
}): Promise<DiscoverFeedPage> {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.cursor?.trim()) params.set("cursor", options.cursor.trim());
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
