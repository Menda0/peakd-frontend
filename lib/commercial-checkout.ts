import { getApiBase } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-error";
import { englishCountryLabel } from "@/lib/countries";
import type { CommercialSettings } from "@/lib/commercial-settings";
import {
  normalizeCommercialSettings,
  type CheckoutPeaksBreakdown,
} from "@/lib/commercial-settings";
import type { DiscoverFeedSession } from "@/lib/discover-feed";
import { normalizeSurferProfile, type SurferProfile } from "@/lib/surfer-profile";

export type WaveCheckoutSessionWave = {
  jobId: string;
  originalFilename: string;
  thumbnailUrl: string | null;
  isCurrent: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
  buyClaimTotalPeaks: number | null;
  sponsorTotalPeaks: number | null;
};

export type WaveCheckoutContext = {
  jobId: string;
  sessionId: string;
  shareToken: string | null;
  location: {
    countryCode: string;
    regionName: string;
    spotName: string | null;
    isUndisclosed: boolean;
  };
  sessionSummary: DiscoverFeedSession;
  partner: {
    partnerName: string;
    avatarUrl: string | null;
    descriptionMarkdown: string | null;
  };
  commercialSettings: CommercialSettings;
  communityFeePercent: number;
  canClaim: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
  buyClaim: CheckoutPeaksBreakdown;
  sponsor: CheckoutPeaksBreakdown;
  surfer: SurferProfile | null;
  sessionWaves: WaveCheckoutSessionWave[];
};

function normalizeBreakdown(raw: unknown): CheckoutPeaksBreakdown | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const basePeaks = Number(o.basePeaks);
  const communityFeePeaks = Number(o.communityFeePeaks);
  const totalPeaks = Number(o.totalPeaks);
  const communityFeePercent = Number(o.communityFeePercent);
  const listPricePeaks = Number(o.listPricePeaks);
  const discountPercent = Number(o.discountPercent);
  const discountPeaksSaved = Number(o.discountPeaksSaved);
  if (
    !Number.isFinite(basePeaks) ||
    !Number.isFinite(communityFeePeaks) ||
    !Number.isFinite(totalPeaks)
  ) {
    return null;
  }
  const base = Math.round(basePeaks);
  const list = Number.isFinite(listPricePeaks) ? Math.round(listPricePeaks) : base;
  return {
    basePeaks: base,
    communityFeePeaks: Math.round(communityFeePeaks),
    totalPeaks: Math.round(totalPeaks),
    communityFeePercent: Number.isFinite(communityFeePercent)
      ? Math.round(communityFeePercent)
      : 20,
    listPricePeaks: list,
    discountPercent: Number.isFinite(discountPercent)
      ? Math.round(discountPercent)
      : 0,
    discountPeaksSaved: Number.isFinite(discountPeaksSaved)
      ? Math.round(discountPeaksSaved)
      : Math.max(0, list - base),
  };
}

export async function fetchWaveCheckoutContext(
  jobId: string,
): Promise<WaveCheckoutContext> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/discover/videos/${encodeURIComponent(jobId)}/checkout`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Could not load checkout details"),
    );
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const settings = normalizeCommercialSettings(o.commercialSettings);
  const buyClaim = normalizeBreakdown(o.buyClaim);
  const sponsor = normalizeBreakdown(o.sponsor);
  if (!settings || !buyClaim || !sponsor) {
    throw new Error("Invalid checkout response");
  }
  const sessionRaw = o.sessionSummary;
  const sessionSummary =
    sessionRaw && typeof sessionRaw === "object"
      ? (sessionRaw as DiscoverFeedSession)
      : {
          sessionDate: "",
          sessionTime: "12:00",
          durationMinutes: 120,
          conditionsRating: null,
          waveTypes: [],
        };
  const locRaw = o.location;
  const location =
    locRaw && typeof locRaw === "object"
      ? {
          countryCode: String((locRaw as Record<string, unknown>).countryCode ?? ""),
          regionName: String((locRaw as Record<string, unknown>).regionName ?? ""),
          spotName:
            (locRaw as Record<string, unknown>).spotName == null
              ? null
              : String((locRaw as Record<string, unknown>).spotName),
          isUndisclosed: (locRaw as Record<string, unknown>).isUndisclosed === true,
        }
      : {
          countryCode: "",
          regionName: "",
          spotName: null,
          isUndisclosed: false,
        };
  const partnerRaw = o.partner;
  const partner =
    partnerRaw && typeof partnerRaw === "object"
      ? {
          partnerName: String(
            (partnerRaw as Record<string, unknown>).partnerName ?? "Partner",
          ),
          avatarUrl:
            (partnerRaw as Record<string, unknown>).avatarUrl == null
              ? null
              : String((partnerRaw as Record<string, unknown>).avatarUrl),
          descriptionMarkdown:
            (partnerRaw as Record<string, unknown>).descriptionMarkdown == null
              ? null
              : String((partnerRaw as Record<string, unknown>).descriptionMarkdown),
        }
      : { partnerName: "Partner", avatarUrl: null, descriptionMarkdown: null };

  const waves: WaveCheckoutSessionWave[] = [];
  if (Array.isArray(o.sessionWaves)) {
    for (const row of o.sessionWaves) {
      if (!row || typeof row !== "object") continue;
      const w = row as Record<string, unknown>;
      if (typeof w.jobId !== "string") continue;
      waves.push({
        jobId: w.jobId,
        originalFilename:
          typeof w.originalFilename === "string" ? w.originalFilename : "video",
        thumbnailUrl:
          typeof w.thumbnailUrl === "string" ? w.thumbnailUrl : null,
        isCurrent: w.isCurrent === true,
        canBuyClaim: w.canBuyClaim === true,
        canSponsor: w.canSponsor === true,
        buyClaimTotalPeaks:
          typeof w.buyClaimTotalPeaks === "number" ? w.buyClaimTotalPeaks : null,
        sponsorTotalPeaks:
          typeof w.sponsorTotalPeaks === "number" ? w.sponsorTotalPeaks : null,
      });
    }
  }

  return {
    jobId: typeof o.jobId === "string" ? o.jobId : jobId,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : "",
    shareToken: typeof o.shareToken === "string" ? o.shareToken : null,
    location,
    sessionSummary,
    partner,
    commercialSettings: settings,
    communityFeePercent:
      typeof o.communityFeePercent === "number" ? o.communityFeePercent : 20,
    canClaim: o.canClaim === true,
    canBuyClaim: o.canBuyClaim === true,
    canSponsor: o.canSponsor === true,
    buyClaim,
    sponsor,
    surfer: normalizeSurferProfile(o.surfer),
    sessionWaves: waves,
  };
}

/** Label for community-fee copy: country when undisclosed, otherwise region name. */
export function communityFundLocationLabel(location: {
  countryCode: string;
  regionName: string;
  spotName: string | null;
  isUndisclosed: boolean;
}): string {
  if (location.isUndisclosed) {
    return (
      englishCountryLabel(location.countryCode) ??
      location.countryCode.trim().toUpperCase() ??
      "this area"
    );
  }
  const region = location.regionName?.trim();
  if (region && region !== "Undisclosed" && region !== "Unknown") {
    return region;
  }
  return (
    englishCountryLabel(location.countryCode) ??
    location.countryCode.trim().toUpperCase() ??
    "this area"
  );
}

export function partnerLocationLabel(location: {
  countryCode: string;
  regionName: string;
  spotName: string | null;
  isUndisclosed: boolean;
}): string {
  if (location.isUndisclosed) {
    const country =
      englishCountryLabel(location.countryCode) ?? location.countryCode;
    return country ? String(country) : "Undisclosed location";
  }
  return [location.spotName, location.regionName].filter(Boolean).join(" · ");
}

export function plainPartnerDescription(
  markdown: string | null,
  maxLines = 3,
): string {
  if (!markdown?.trim()) return "";
  const lines = markdown
    .split(/\n/)
    .map((l) => l.replace(/[#*_`[\]()]/g, "").trim())
    .filter(Boolean);
  if (lines.length > 0) {
    return lines.slice(0, maxLines).join("\n");
  }
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
