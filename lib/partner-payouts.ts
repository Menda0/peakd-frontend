/** DTOs aligned with Nest `/partners/me/payouts/*`. Direct Connect payouts. */

import { normalizeCurrency } from "@/lib/currencies";

export const PARTNER_PAYOUTS_BASE_PATH = "partners/me/payouts";

export const PARTNER_ONBOARDING_STATUSES = [
  "not_started",
  "pending",
  "enabled",
] as const;
export type PartnerOnboardingStatus =
  (typeof PARTNER_ONBOARDING_STATUSES)[number];

export type PartnerEarningsTotalDto = {
  /** Uppercase ISO 4217 currency. */
  currency: string;
  totalMinor: number;
};

export type PartnerPayoutsStatusDto = {
  earningsTotalsByCurrency: PartnerEarningsTotalDto[];
  onboardingStatus: PartnerOnboardingStatus;
  payoutsEnabled: boolean;
  requirementsDue: string[];
};

export type PartnerEarningBuyerDto = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type PartnerEarningRowDto = {
  id: string;
  orderId: string;
  jobIds: string[];
  amountMinor: number;
  /** Uppercase ISO 4217 currency. */
  currency: string;
  countryCode: string;
  regionId: string;
  intent: "buy_claim" | "sponsor";
  createdAt: string;
  buyer: PartnerEarningBuyerDto;
  /** Up to 3 thumbnail URLs for the unlocked video(s). */
  previewThumbnailUrls: string[];
};

export type PartnerEarningsPageDto = {
  items: PartnerEarningRowDto[];
  nextCursor: string | null;
};

function isOnboardingStatus(value: unknown): value is PartnerOnboardingStatus {
  return (
    typeof value === "string" &&
    (PARTNER_ONBOARDING_STATUSES as readonly string[]).includes(value)
  );
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
}

function normalizeEarningsTotal(raw: unknown): PartnerEarningsTotalDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const currency =
    typeof o.currency === "string" && o.currency.trim()
      ? normalizeCurrency(o.currency)
      : null;
  if (!currency) return null;
  return {
    currency,
    totalMinor: Math.max(0, num(o.totalMinor)),
  };
}

export function normalizePartnerPayoutsStatus(
  raw: unknown,
): PartnerPayoutsStatusDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isOnboardingStatus(o.onboardingStatus)) return null;
  const requirementsDue = Array.isArray(o.requirementsDue)
    ? o.requirementsDue.filter((x): x is string => typeof x === "string")
    : [];
  const earningsTotalsByCurrency = Array.isArray(o.earningsTotalsByCurrency)
    ? o.earningsTotalsByCurrency
        .map(normalizeEarningsTotal)
        .filter((t): t is PartnerEarningsTotalDto => t != null)
    : [];
  return {
    earningsTotalsByCurrency,
    onboardingStatus: o.onboardingStatus,
    payoutsEnabled: Boolean(o.payoutsEnabled),
    requirementsDue,
  };
}

function normalizeBuyer(raw: unknown): PartnerEarningBuyerDto {
  if (!raw || typeof raw !== "object") {
    return { userId: "", displayName: null, avatarUrl: null };
  }
  const o = raw as Record<string, unknown>;
  return {
    userId: typeof o.userId === "string" ? o.userId : "",
    displayName:
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName
        : null,
    avatarUrl:
      typeof o.avatarUrl === "string" && o.avatarUrl.trim()
        ? o.avatarUrl
        : null,
  };
}

export function normalizePartnerEarningsPage(
  raw: unknown,
): PartnerEarningsPageDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const items: PartnerEarningRowDto[] = [];
  for (const r of o.items) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const intent: "buy_claim" | "sponsor" =
      row.intent === "sponsor" ? "sponsor" : "buy_claim";
    const jobIds = Array.isArray(row.jobIds)
      ? row.jobIds.filter((x): x is string => typeof x === "string")
      : [];
    items.push({
      id: String(row.id ?? ""),
      orderId: String(row.orderId ?? row.id ?? ""),
      jobIds,
      amountMinor: Math.max(0, num(row.amountMinor)),
      currency:
        typeof row.currency === "string" && row.currency.trim()
          ? normalizeCurrency(row.currency)
          : "EUR",
      countryCode: typeof row.countryCode === "string" ? row.countryCode : "",
      regionId: typeof row.regionId === "string" ? row.regionId : "",
      intent,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date().toISOString(),
      buyer: normalizeBuyer(row.buyer),
      previewThumbnailUrls: Array.isArray(row.previewThumbnailUrls)
        ? row.previewThumbnailUrls
            .filter((x): x is string => typeof x === "string" && x.length > 0)
            .slice(0, 3)
        : [],
    });
  }
  return {
    items,
    nextCursor: typeof o.nextCursor === "string" ? o.nextCursor : null,
  };
}
