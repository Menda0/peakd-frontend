import type { SurferProfile } from "@/lib/surfer-profile";
import { normalizeSurferProfile } from "@/lib/surfer-profile";
import {
  normalizeSearchSession,
  type SearchSessionItem,
} from "@/lib/feed-search";

export type LandingWaveLocation = {
  countryCode: string;
  regionName: string;
  spotName: string | null;
  isUndisclosed: boolean;
};

export type LandingFeaturedWave = {
  jobId: string;
  sessionId: string;
  shareToken: string | null;
  claimStatus: "auto" | "claimed";
  claimedAt: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isCommercial: boolean;
  surfer: SurferProfile | null;
  location: LandingWaveLocation;
  sessionDate: string;
  sessionTime: string;
};

export type LandingHeroBackgroundVideo = {
  videoUrl: string;
  thumbnailUrl: string | null;
};

export type LandingPageData = {
  visitorCountryCode: string | null;
  featuredWaves: LandingFeaturedWave[];
  sessions: SearchSessionItem[];
  heroBackgroundVideo: LandingHeroBackgroundVideo | null;
};

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

function normalizeLocation(raw: unknown): LandingWaveLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const countryCode =
    typeof o.countryCode === "string" ? o.countryCode.trim().toUpperCase() : "";
  const regionName =
    typeof o.regionName === "string" ? o.regionName.trim() : "Unknown";
  const spotName =
    typeof o.spotName === "string" && o.spotName.trim()
      ? o.spotName.trim()
      : null;
  return {
    countryCode,
    regionName,
    spotName,
    isUndisclosed: o.isUndisclosed === true,
  };
}

function normalizeFeaturedWave(raw: unknown): LandingFeaturedWave | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const jobId = typeof o.jobId === "string" ? o.jobId.trim() : "";
  if (!jobId) return null;
  const location = normalizeLocation(o.location);
  if (!location) return null;
  const claimStatus = o.claimStatus === "auto" ? "auto" : "claimed";
  return {
    jobId,
    sessionId: typeof o.sessionId === "string" ? o.sessionId.trim() : "",
    shareToken:
      typeof o.shareToken === "string" && o.shareToken.trim()
        ? o.shareToken.trim()
        : null,
    claimStatus,
    claimedAt: typeof o.claimedAt === "string" ? o.claimedAt : "",
    thumbnailUrl:
      typeof o.thumbnailUrl === "string" ? o.thumbnailUrl : null,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : null,
    isCommercial: o.isCommercial === true,
    surfer: normalizeSurferProfile(o.surfer),
    location,
    sessionDate:
      typeof o.sessionDate === "string" ? o.sessionDate.trim() : "",
    sessionTime:
      typeof o.sessionTime === "string" ? o.sessionTime.trim() : "12:00",
  };
}

function normalizeHeroBackgroundVideo(
  raw: unknown,
): LandingHeroBackgroundVideo | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const videoUrl = typeof o.videoUrl === "string" ? o.videoUrl.trim() : "";
  if (!videoUrl) return null;
  return {
    videoUrl,
    thumbnailUrl:
      typeof o.thumbnailUrl === "string" ? o.thumbnailUrl.trim() || null : null,
  };
}

function normalizeLandingPageData(raw: unknown): LandingPageData {
  if (!raw || typeof raw !== "object") {
    return {
      visitorCountryCode: null,
      featuredWaves: [],
      sessions: [],
      heroBackgroundVideo: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const visitorCountryCode =
    typeof o.visitorCountryCode === "string" &&
    /^[A-Z]{2}$/.test(o.visitorCountryCode.trim())
      ? o.visitorCountryCode.trim().toUpperCase()
      : null;
  const featuredWaves = Array.isArray(o.featuredWaves)
    ? o.featuredWaves.flatMap((item) => {
        const wave = normalizeFeaturedWave(item);
        return wave ? [wave] : [];
      })
    : [];
  const sessions = Array.isArray(o.sessions)
    ? o.sessions
        .map(normalizeSearchSession)
        .filter((s): s is SearchSessionItem => s != null)
    : [];
  return {
    visitorCountryCode,
    featuredWaves,
    sessions,
    heroBackgroundVideo: normalizeHeroBackgroundVideo(o.heroBackgroundVideo),
  };
}

export async function fetchLandingPageData(options?: {
  countryCode?: string | null;
  wavesLimit?: number;
  sessionsLimit?: number;
}): Promise<LandingPageData> {
  const params = new URLSearchParams();
  if (options?.countryCode?.trim()) {
    params.set("countryCode", options.countryCode.trim().toUpperCase());
  }
  if (options?.wavesLimit != null && options.wavesLimit > 0) {
    params.set("wavesLimit", String(options.wavesLimit));
  }
  if (options?.sessionsLimit != null && options.sessionsLimit > 0) {
    params.set("sessionsLimit", String(options.sessionsLimit));
  }

  const qs = params.toString();
  const url = `${apiBase()}/public/landing${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  return normalizeLandingPageData(raw);
}

export const EMPTY_LANDING_PAGE: LandingPageData = {
  visitorCountryCode: null,
  featuredWaves: [],
  sessions: [],
  heroBackgroundVideo: null,
};
