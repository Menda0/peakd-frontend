import { getApiBase } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-error";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import {
  formatLocationLabel,
  formatSessionLocationLabel,
  formatSessionSummary,
  type DiscoverFeedLocation,
  type DiscoverFeedSession,
} from "@/lib/discover-feed";
import { normalizeCurrency } from "@/lib/currencies";
import {
  normalizeSurferProfile,
  type SurferProfile,
} from "@/lib/surfer-profile";

export type PublicSharedSessionWave = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  /** Pre-formatted on the server to avoid hydration locale mismatches. */
  createdAtLabel?: string;
  thumbnailUrls: string[];
  thumbnailUrl: string | null;
  snapshotUrls: string[];
  videoUrl: string | null;
  processedDownloadUrl: string | null;
  hasOriginal: boolean;
  originalDownloadUrl: string | null;
  claimStatus: "none" | "claimed" | "auto";
  canClaim: boolean;
  surfer: SurferProfile | null;
  isCommercial: boolean;
  videoUnlockedByViewer: boolean;
  currency: string | null;
  wavePriceMinor: number | null;
  buyClaimPriceMinor: number | null;
  sponsorPriceMinor: number | null;
  canBuyClaim: boolean;
  canSponsor: boolean;
  claimedByViewer: boolean;
};

export type PublicSharedSession = {
  shareToken: string;
  isCommercial: boolean;
  partnerName: string | null;
  partnerAvatarUrl: string | null;
  exports: {
    processedReady: boolean;
    processedExportStatus: string;
  };
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

export function sharedSessionZipDownloadPath(shareToken: string): string {
  return `/api/public/shared-sessions/${encodeURIComponent(shareToken)}/export/download`;
}

/** Trigger browser download for a presigned URL (processed or original clip). */
export function downloadFromUrl(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
  const raw = (await res.json()) as PublicSharedSession;
  return normalizePublicSharedSession(raw);
}

export async function fetchAuthenticatedSharedSession(
  shareToken: string,
): Promise<PublicSharedSession> {
  const token = shareToken.trim();
  const res = await fetch(
    `${getApiBase()}/shared-sessions/${encodeURIComponent(token)}`,
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Could not load shared session"),
    );
  }
  const raw = (await res.json()) as PublicSharedSession;
  return normalizePublicSharedSession(raw);
}

function normalizePublicSharedSession(raw: PublicSharedSession): PublicSharedSession {
  return {
    ...raw,
    isCommercial: raw.isCommercial === true,
    waves: raw.waves.map((wave) => normalizePublicSharedSessionWave(wave)),
  };
}

function normalizePublicSharedSessionWave(
  wave: PublicSharedSessionWave,
): PublicSharedSessionWave {
  const thumbs = Array.isArray(wave.thumbnailUrls) ? wave.thumbnailUrls : [];
  const snapshots =
    Array.isArray(wave.snapshotUrls) && wave.snapshotUrls.length > 0
      ? wave.snapshotUrls
      : thumbs;
  return {
    ...wave,
    thumbnailUrls: thumbs,
    snapshotUrls: snapshots,
    thumbnailUrl:
      wave.thumbnailUrl ??
      snapshots[0] ??
      thumbs[0] ??
      null,
    videoUrl: typeof wave.videoUrl === "string" ? wave.videoUrl : null,
    processedDownloadUrl:
      typeof wave.processedDownloadUrl === "string"
        ? wave.processedDownloadUrl
        : null,
    surfer: normalizeSurferProfile(wave.surfer),
    isCommercial: wave.isCommercial === true,
    videoUnlockedByViewer: wave.videoUnlockedByViewer === true,
    canBuyClaim: wave.canBuyClaim === true,
    canSponsor: wave.canSponsor === true,
    claimedByViewer: wave.claimedByViewer === true,
    currency:
      typeof wave.currency === "string" && wave.currency.trim()
        ? normalizeCurrency(wave.currency)
        : null,
    wavePriceMinor:
      typeof wave.wavePriceMinor === "number"
        ? Math.round(wave.wavePriceMinor)
        : null,
    buyClaimPriceMinor:
      typeof wave.buyClaimPriceMinor === "number"
        ? Math.round(wave.buyClaimPriceMinor)
        : null,
    sponsorPriceMinor:
      typeof wave.sponsorPriceMinor === "number"
        ? Math.round(wave.sponsorPriceMinor)
        : null,
  };
}

export function sharedSessionToFeedLocation(
  session: PublicSharedSession["session"],
): DiscoverFeedLocation {
  return {
    countryCode: session.countryCode,
    regionName: session.regionName,
    spotName: session.spotName,
    isUndisclosed: session.isUndisclosed,
  };
}

export function sharedSessionToFeedSession(
  session: PublicSharedSession["session"],
): DiscoverFeedSession {
  return {
    sessionDate: session.sessionDate,
    sessionTime: session.sessionTime,
    durationMinutes: session.durationMinutes,
    conditionsRating: session.conditionsRating,
    waveTypes: session.waveTypes,
  };
}

export function sharedSessionWaveToDiscoverPost(
  wave: PublicSharedSessionWave,
  ctx: {
    partnerName: string;
    partnerAvatarUrl: string | null;
    location: DiscoverFeedLocation;
    feedSession: DiscoverFeedSession;
  },
): DiscoverFeedPost {
  const timeAgo = wave.createdAtLabel ?? wave.createdAt;
  return {
    id: wave.jobId,
    authorName: ctx.partnerName,
    authorAvatarUrl: ctx.partnerAvatarUrl,
    isPartnerUpload: true,
    location: formatLocationLabel(ctx.location),
    sessionLocation: formatSessionLocationLabel(ctx.location),
    sessionSummary: formatSessionSummary(ctx.location, ctx.feedSession),
    timeAgo,
    createdAt: wave.createdAt,
    session: ctx.feedSession,
    videoUrl: wave.videoUrl,
    thumbnailUrl: wave.thumbnailUrl,
    snapshotUrls:
      wave.snapshotUrls.length > 0
        ? wave.snapshotUrls
        : wave.thumbnailUrls,
    status: "completed",
    claimStatus: wave.claimStatus,
    claimedByViewer: wave.claimedByViewer,
    isOwnUpload: false,
    surfer: wave.surfer,
    shakaCount: 0,
    shakaedByViewer: false,
    comments: 0,
    shares: 0,
    isCommercial: wave.isCommercial,
    videoUnlockedByViewer: wave.videoUnlockedByViewer,
    currency: wave.currency,
    wavePriceMinor: wave.wavePriceMinor,
    buyClaimPriceMinor: wave.buyClaimPriceMinor,
    sponsorPriceMinor: wave.sponsorPriceMinor,
    canClaim: wave.canClaim,
    canBuyClaim: wave.canBuyClaim,
    canSponsor: wave.canSponsor,
  };
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
