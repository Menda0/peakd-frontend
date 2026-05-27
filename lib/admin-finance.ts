export const ADMIN_FINANCE_PATH = "admin/finance";

export type AdminFinanceCurrencyRowDto = {
  currency: string;
  stripe: {
    availableMinor: number;
    pendingMinor: number;
    error: string | null;
  };
  ledger: {
    totalRevenueMinor: number;
    totalStripeFeesMinor: number;
    totalPartnerSubtotalMinor: number;
    totalPlatformCommissionMinor: number;
    totalOrders: number;
    totalPartnerLiabilityMinor: number;
    totalPartnerPaidOutMinor: number;
  };
  derived: {
    netPlatformMarginMinor: number;
    liabilityVsBalanceDeltaMinor: number;
  };
};

export type AdminFinanceOverviewDto = {
  fetchedAt: string;
  platformCommissionPercent: number;
  rows: AdminFinanceCurrencyRowDto[];
  stripeError: string | null;
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeRow(raw: unknown): AdminFinanceCurrencyRowDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const currency = str(o.currency).toUpperCase();
  if (!currency) return null;
  const stripe = (o.stripe ?? {}) as Record<string, unknown>;
  const ledger = (o.ledger ?? {}) as Record<string, unknown>;
  const derived = (o.derived ?? {}) as Record<string, unknown>;
  return {
    currency,
    stripe: {
      availableMinor: num(stripe.availableMinor),
      pendingMinor: num(stripe.pendingMinor),
      error: stripe.error == null ? null : str(stripe.error) || null,
    },
    ledger: {
      totalRevenueMinor: num(ledger.totalRevenueMinor),
      totalStripeFeesMinor: num(ledger.totalStripeFeesMinor),
      totalPartnerSubtotalMinor: num(ledger.totalPartnerSubtotalMinor),
      totalPlatformCommissionMinor: num(ledger.totalPlatformCommissionMinor),
      totalOrders: num(ledger.totalOrders),
      totalPartnerLiabilityMinor: num(ledger.totalPartnerLiabilityMinor),
      totalPartnerPaidOutMinor: num(ledger.totalPartnerPaidOutMinor),
    },
    derived: {
      netPlatformMarginMinor:
        typeof derived.netPlatformMarginMinor === "number"
          ? Math.round(derived.netPlatformMarginMinor)
          : 0,
      liabilityVsBalanceDeltaMinor:
        typeof derived.liabilityVsBalanceDeltaMinor === "number"
          ? Math.round(derived.liabilityVsBalanceDeltaMinor)
          : 0,
    },
  };
}

export function normalizeAdminFinanceOverview(
  raw: unknown,
): AdminFinanceOverviewDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const rows = Array.isArray(o.rows)
    ? o.rows
        .map(normalizeRow)
        .filter((r): r is AdminFinanceCurrencyRowDto => r !== null)
    : [];
  return {
    fetchedAt: str(o.fetchedAt) || new Date().toISOString(),
    platformCommissionPercent:
      typeof o.platformCommissionPercent === "number"
        ? Math.round(o.platformCommissionPercent)
        : 20,
    rows,
    stripeError: o.stripeError == null ? null : str(o.stripeError) || null,
  };
}
