export const ADMIN_SALES_PATH = "admin/sales";

export type AdminSalesCurrencyTotalDto = {
  currency: string;
  transactionCount: number;
  partnerSubtotalMinor: number;
  platformCommissionMinor: number;
  totalAmountMinor: number;
};

export type AdminSalesSummaryDto = {
  unlockTransactionCount: number;
  byCurrency: AdminSalesCurrencyTotalDto[];
  countryCommissionByCurrency: AdminSalesCurrencyTotalDto[] | null;
  regionsCommissionByCurrency: AdminSalesCurrencyTotalDto[] | null;
};

export type AdminSalesTransactionDto = {
  id: string;
  orderId: string;
  jobIds: string[];
  intent: "buy_claim" | "sponsor";
  buyerUserId: string;
  buyerDisplayName: string | null;
  buyerAvatarUrl: string | null;
  partnerUserId: string;
  currency: string;
  partnerSubtotalMinor: number;
  platformCommissionMinor: number;
  totalAmountMinor: number;
  discountPercent: number;
  countryCode: string;
  regionId: string;
  regionName: string | null;
  completedAt: string;
};

export type AdminSalesTransactionsPageDto = {
  items: AdminSalesTransactionDto[];
  nextCursor: string | null;
};

export type AdminSalesGeoRowDto = {
  countryCode?: string;
  regionId?: string;
  regionName?: string | null;
  currency: string;
  transactionCount: number;
  partnerSubtotalMinor: number;
  platformCommissionMinor: number;
  totalAmountMinor: number;
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeCurrencyTotal(
  raw: unknown,
): AdminSalesCurrencyTotalDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const currency = str(o.currency);
  if (!currency) return null;
  return {
    currency: currency.toUpperCase(),
    transactionCount: num(o.transactionCount),
    partnerSubtotalMinor: num(o.partnerSubtotalMinor),
    platformCommissionMinor: num(o.platformCommissionMinor),
    totalAmountMinor: num(o.totalAmountMinor),
  };
}

function normalizeCurrencyTotalList(
  raw: unknown,
): AdminSalesCurrencyTotalDto[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminSalesCurrencyTotalDto[] = [];
  for (const item of raw) {
    const dto = normalizeCurrencyTotal(item);
    if (dto) out.push(dto);
  }
  return out;
}

export function normalizeAdminSalesSummary(
  raw: unknown,
): AdminSalesSummaryDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    unlockTransactionCount: num(o.unlockTransactionCount),
    byCurrency: normalizeCurrencyTotalList(o.byCurrency),
    countryCommissionByCurrency:
      o.countryCommissionByCurrency == null
        ? null
        : normalizeCurrencyTotalList(o.countryCommissionByCurrency),
    regionsCommissionByCurrency:
      o.regionsCommissionByCurrency == null
        ? null
        : normalizeCurrencyTotalList(o.regionsCommissionByCurrency),
  };
}

export function normalizeAdminSalesTransaction(
  raw: unknown,
): AdminSalesTransactionDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.orderId !== "string") return null;
  const intent: "buy_claim" | "sponsor" =
    o.intent === "sponsor" ? "sponsor" : "buy_claim";
  const jobIds = Array.isArray(o.jobIds)
    ? o.jobIds
        .map((v) => (typeof v === "string" ? v : ""))
        .filter((s) => Boolean(s))
    : [];
  return {
    id: o.id,
    orderId: o.orderId,
    jobIds,
    intent,
    buyerUserId: str(o.buyerUserId),
    buyerDisplayName:
      o.buyerDisplayName == null ? null : str(o.buyerDisplayName) || null,
    buyerAvatarUrl:
      o.buyerAvatarUrl == null ? null : str(o.buyerAvatarUrl) || null,
    partnerUserId: str(o.partnerUserId),
    currency: str(o.currency).toUpperCase(),
    partnerSubtotalMinor: num(o.partnerSubtotalMinor),
    platformCommissionMinor: num(o.platformCommissionMinor),
    totalAmountMinor: num(o.totalAmountMinor),
    discountPercent: num(o.discountPercent),
    countryCode: str(o.countryCode),
    regionId: str(o.regionId),
    regionName: o.regionName == null ? null : str(o.regionName) || null,
    completedAt: str(o.completedAt),
  };
}

export function normalizeAdminSalesTransactionsPage(
  raw: unknown,
): AdminSalesTransactionsPageDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const items: AdminSalesTransactionDto[] = [];
  for (const item of o.items) {
    const dto = normalizeAdminSalesTransaction(item);
    if (dto) items.push(dto);
  }
  return {
    items,
    nextCursor: o.nextCursor == null ? null : str(o.nextCursor) || null,
  };
}

export function normalizeAdminSalesGeoRow(
  raw: unknown,
): AdminSalesGeoRowDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const currency = str(o.currency).toUpperCase();
  if (!currency) return null;
  return {
    countryCode: o.countryCode == null ? undefined : str(o.countryCode),
    regionId: o.regionId == null ? undefined : str(o.regionId),
    regionName: o.regionName == null ? null : str(o.regionName) || null,
    currency,
    transactionCount: num(o.transactionCount),
    partnerSubtotalMinor: num(o.partnerSubtotalMinor),
    platformCommissionMinor: num(o.platformCommissionMinor),
    totalAmountMinor: num(o.totalAmountMinor),
  };
}

export function normalizeAdminSalesGeoList(
  raw: unknown,
): AdminSalesGeoRowDto[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminSalesGeoRowDto[] = [];
  for (const item of raw) {
    const dto = normalizeAdminSalesGeoRow(item);
    if (dto) out.push(dto);
  }
  return out;
}
