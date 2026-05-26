export const ADMIN_FINANCE_PATH = "admin/finance";

export type AdminFinanceOverviewDto = {
  fetchedAt: string;
  peaksPerEuro: number;
  stripe: {
    availableEurCents: number;
    pendingEurCents: number;
    nonEurCurrencies: string[];
    error: string | null;
  };
  ledger: {
    totalRevenueCents: number;
    totalStripeFeesCents: number;
    purchasesWithFeeData: number;
    totalPurchases: number;
    totalPartnerLiabilityCents: number;
    totalPartnerPaidOutCents: number;
    totalPlatformRetentionPeaks: number;
    totalPlatformRetentionEurCents: number;
  };
  derived: {
    netPlatformMarginCents: number;
    liabilityVsBalanceDeltaCents: number;
  };
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export function normalizeAdminFinanceOverview(
  raw: unknown,
): AdminFinanceOverviewDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const stripe = o.stripe as Record<string, unknown> | undefined;
  const ledger = o.ledger as Record<string, unknown> | undefined;
  const derived = o.derived as Record<string, unknown> | undefined;
  if (!stripe || !ledger || !derived) return null;
  return {
    fetchedAt: str(o.fetchedAt) || new Date().toISOString(),
    peaksPerEuro:
      typeof o.peaksPerEuro === "number" && o.peaksPerEuro > 0
        ? o.peaksPerEuro
        : 100,
    stripe: {
      availableEurCents: num(stripe.availableEurCents),
      pendingEurCents: num(stripe.pendingEurCents),
      nonEurCurrencies: strList(stripe.nonEurCurrencies),
      error: stripe.error == null ? null : str(stripe.error) || null,
    },
    ledger: {
      totalRevenueCents: num(ledger.totalRevenueCents),
      totalStripeFeesCents: num(ledger.totalStripeFeesCents),
      purchasesWithFeeData: num(ledger.purchasesWithFeeData),
      totalPurchases: num(ledger.totalPurchases),
      totalPartnerLiabilityCents: num(ledger.totalPartnerLiabilityCents),
      totalPartnerPaidOutCents: num(ledger.totalPartnerPaidOutCents),
      totalPlatformRetentionPeaks: num(ledger.totalPlatformRetentionPeaks),
      totalPlatformRetentionEurCents: num(ledger.totalPlatformRetentionEurCents),
    },
    derived: {
      netPlatformMarginCents:
        typeof derived.netPlatformMarginCents === "number"
          ? Math.round(derived.netPlatformMarginCents)
          : 0,
      liabilityVsBalanceDeltaCents:
        typeof derived.liabilityVsBalanceDeltaCents === "number"
          ? Math.round(derived.liabilityVsBalanceDeltaCents)
          : 0,
    },
  };
}

const EUR_FORMATTER = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export function formatEurCents(cents: number): string {
  return EUR_FORMATTER.format(cents / 100);
}
