/** DTOs aligned with Nest `/partners/me/payouts/*`. */

export const PARTNER_PAYOUTS_BASE_PATH = "partners/me/payouts";

export const PARTNER_ONBOARDING_STATUSES = [
  "not_started",
  "pending",
  "enabled",
] as const;
export type PartnerOnboardingStatus =
  (typeof PARTNER_ONBOARDING_STATUSES)[number];

export const PARTNER_WITHDRAWAL_STATUSES = [
  "pending",
  "completed",
  "failed",
] as const;
export type PartnerWithdrawalStatus =
  (typeof PARTNER_WITHDRAWAL_STATUSES)[number];

export type PartnerWithdrawalDto = {
  id: string;
  amountCents: number;
  currency: string;
  status: PartnerWithdrawalStatus;
  failureReason: string | null;
  createdAt: string;
};

export type PartnerPayoutsStatusDto = {
  withdrawableAmountCents: number;
  minWithdrawalAmountCents: number;
  currency: "eur";
  onboardingStatus: PartnerOnboardingStatus;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  recentWithdrawals: PartnerWithdrawalDto[];
};

export type PartnerEarningRowDto = {
  id: string;
  jobId: string;
  amountCents: number;
  countryCode: string;
  regionId: string;
  type: string;
  createdAt: string;
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

function isWithdrawalStatus(value: unknown): value is PartnerWithdrawalStatus {
  return (
    typeof value === "string" &&
    (PARTNER_WITHDRAWAL_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeWithdrawal(raw: unknown): PartnerWithdrawalDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isWithdrawalStatus(o.status)) return null;
  return {
    id: String(o.id ?? ""),
    amountCents: Number(o.amountCents) || 0,
    currency: typeof o.currency === "string" ? o.currency : "eur",
    status: o.status,
    failureReason: o.failureReason == null ? null : String(o.failureReason),
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
  };
}

export function normalizePartnerPayoutsStatus(
  raw: unknown,
): PartnerPayoutsStatusDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isOnboardingStatus(o.onboardingStatus)) return null;
  const recent = Array.isArray(o.recentWithdrawals)
    ? (o.recentWithdrawals
        .map(normalizeWithdrawal)
        .filter((x): x is PartnerWithdrawalDto => x != null))
    : [];
  const requirementsDue = Array.isArray(o.requirementsDue)
    ? o.requirementsDue.filter((x): x is string => typeof x === "string")
    : [];
  return {
    withdrawableAmountCents: Math.max(0, Number(o.withdrawableAmountCents) || 0),
    minWithdrawalAmountCents: Math.max(
      0,
      Number(o.minWithdrawalAmountCents) || 0,
    ),
    currency: "eur",
    onboardingStatus: o.onboardingStatus,
    payoutsEnabled: Boolean(o.payoutsEnabled),
    requirementsDue,
    recentWithdrawals: recent,
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
    items.push({
      id: String(row.id ?? ""),
      jobId: String(row.jobId ?? ""),
      amountCents: Math.max(0, Number(row.amountCents) || 0),
      countryCode: typeof row.countryCode === "string" ? row.countryCode : "",
      regionId: typeof row.regionId === "string" ? row.regionId : "",
      type: typeof row.type === "string" ? row.type : "",
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date().toISOString(),
    });
  }
  return {
    items,
    nextCursor: typeof o.nextCursor === "string" ? o.nextCursor : null,
  };
}
