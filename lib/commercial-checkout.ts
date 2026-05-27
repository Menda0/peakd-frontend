import { getApiBase } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-error";
import { englishCountryLabel } from "@/lib/countries";
import {
  normalizeCommercialSettings,
  PLATFORM_COMMISSION_PERCENT_DEFAULT,
  type CheckoutBreakdownMinor,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import { normalizeCurrency } from "@/lib/currencies";
import type { DiscoverFeedSession } from "@/lib/discover-feed";
import { normalizeSurferProfile, type SurferProfile } from "@/lib/surfer-profile";

export type WaveCheckoutSessionWave = {
  jobId: string;
  originalFilename: string;
  thumbnailUrl: string | null;
  isCurrent: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
  buyClaimTotalMinor: number | null;
  sponsorTotalMinor: number | null;
};

export type WaveCheckoutContext = {
  jobId: string;
  sessionId: string;
  shareToken: string | null;
  currency: string;
  platformCommissionPercent: number;
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
  canClaim: boolean;
  canBuyClaim: boolean;
  canSponsor: boolean;
  claimStatus: "none" | "auto" | "claimed";
  buyClaim: CheckoutBreakdownMinor;
  sponsor: CheckoutBreakdownMinor;
  surfer: SurferProfile | null;
  sessionWaves: WaveCheckoutSessionWave[];
};

function normalizeBreakdown(raw: unknown): CheckoutBreakdownMinor | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const basePriceMinor = Number(o.basePriceMinor);
  const commissionMinor = Number(o.commissionMinor);
  const totalMinor = Number(o.totalMinor);
  const stripeProcessingFeeMinor = Number(o.stripeProcessingFeeMinor);
  const commissionPercent = Number(o.commissionPercent);
  const listPriceMinor = Number(o.listPriceMinor);
  const discountPercent = Number(o.discountPercent);
  const discountSavedMinor = Number(o.discountSavedMinor);
  if (
    !Number.isFinite(basePriceMinor) ||
    !Number.isFinite(commissionMinor) ||
    !Number.isFinite(totalMinor)
  ) {
    return null;
  }
  const base = Math.round(basePriceMinor);
  const list = Number.isFinite(listPriceMinor) ? Math.round(listPriceMinor) : base;
  return {
    basePriceMinor: base,
    commissionMinor: Math.round(commissionMinor),
    stripeProcessingFeeMinor: Number.isFinite(stripeProcessingFeeMinor)
      ? Math.round(stripeProcessingFeeMinor)
      : 0,
    totalMinor: Math.round(totalMinor),
    commissionPercent: Number.isFinite(commissionPercent)
      ? Math.round(commissionPercent)
      : PLATFORM_COMMISSION_PERCENT_DEFAULT,
    listPriceMinor: list,
    discountPercent: Number.isFinite(discountPercent)
      ? Math.round(discountPercent)
      : 0,
    discountSavedMinor: Number.isFinite(discountSavedMinor)
      ? Math.round(discountSavedMinor)
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
        buyClaimTotalMinor:
          typeof w.buyClaimTotalMinor === "number" ? w.buyClaimTotalMinor : null,
        sponsorTotalMinor:
          typeof w.sponsorTotalMinor === "number" ? w.sponsorTotalMinor : null,
      });
    }
  }

  const currency =
    typeof o.currency === "string" && o.currency.trim()
      ? normalizeCurrency(o.currency)
      : settings.currency;

  return {
    jobId: typeof o.jobId === "string" ? o.jobId : jobId,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : "",
    shareToken: typeof o.shareToken === "string" ? o.shareToken : null,
    currency,
    platformCommissionPercent:
      typeof o.platformCommissionPercent === "number"
        ? Math.round(o.platformCommissionPercent)
        : PLATFORM_COMMISSION_PERCENT_DEFAULT,
    location,
    sessionSummary,
    partner,
    commercialSettings: settings,
    canClaim: o.canClaim === true,
    canBuyClaim: o.canBuyClaim === true,
    canSponsor: o.canSponsor === true,
    claimStatus:
      o.claimStatus === "claimed" || o.claimStatus === "auto"
        ? o.claimStatus
        : "none",
    buyClaim,
    sponsor,
    surfer: normalizeSurferProfile(o.surfer),
    sessionWaves: waves,
  };
}

/** Label for commission location copy: country when undisclosed, otherwise region name. */
export function commissionLocationLabel(location: {
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
