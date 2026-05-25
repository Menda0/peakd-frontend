export const ADMIN_PEAKS_PATH = "admin/peaks";

export type AdminPeaksSummaryDto = {
  circulatingPeaks: number;
  unlockTransactionCount: number;
  totalPeaksCharged: number;
  totalPartnerPeaks: number;
  totalCommunityFeePeaks: number;
  countryCommunityFeePeaks: number | null;
  regionsCommunityFeePeaks: number | null;
  peaksPerEuro: number;
};

export const DEFAULT_PEAKS_PER_EURO = 100;

export function peaksToEurCents(peaks: number, peaksPerEuro: number): number {
  if (!Number.isFinite(peaks) || peaks <= 0) return 0;
  const rate = peaksPerEuro > 0 ? peaksPerEuro : DEFAULT_PEAKS_PER_EURO;
  return Math.round((peaks * 100) / rate);
}

export function formatPeaksEur(peaks: number, peaksPerEuro: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(peaksToEurCents(peaks, peaksPerEuro) / 100);
}

export type AdminPeaksTransactionDto = {
  id: string;
  jobId: string;
  sessionId: string;
  type: string;
  buyerUserId: string;
  buyerDisplayName: string | null;
  buyerAvatarUrl: string | null;
  partnerUserId: string;
  beneficiaryUserId: string;
  peaksCharged: number;
  basePeaks: number;
  communityFeePeaks: number;
  discountPercent: number;
  countryCode: string;
  regionId: string;
  regionName: string | null;
  createdAt: string;
};

export type AdminPeaksTransactionsPageDto = {
  items: AdminPeaksTransactionDto[];
  nextCursor: string | null;
};

export type AdminPeaksGeoRowDto = {
  countryCode?: string;
  regionId?: string;
  regionName?: string | null;
  transactionCount: number;
  communityFeePeaks: number;
  partnerPeaks: number;
  totalPeaksCharged: number;
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function normalizeAdminPeaksSummary(raw: unknown): AdminPeaksSummaryDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    circulatingPeaks: num(o.circulatingPeaks),
    unlockTransactionCount: num(o.unlockTransactionCount),
    totalPeaksCharged: num(o.totalPeaksCharged),
    totalPartnerPeaks: num(o.totalPartnerPeaks),
    totalCommunityFeePeaks: num(o.totalCommunityFeePeaks),
    countryCommunityFeePeaks:
      o.countryCommunityFeePeaks == null ? null : num(o.countryCommunityFeePeaks),
    regionsCommunityFeePeaks:
      o.regionsCommunityFeePeaks == null ? null : num(o.regionsCommunityFeePeaks),
    peaksPerEuro:
      typeof o.peaksPerEuro === "number" && o.peaksPerEuro > 0
        ? o.peaksPerEuro
        : DEFAULT_PEAKS_PER_EURO,
  };
}

export function normalizeAdminPeaksTransaction(raw: unknown): AdminPeaksTransactionDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.jobId !== "string") return null;
  return {
    id: o.id,
    jobId: o.jobId,
    sessionId: str(o.sessionId),
    type: str(o.type),
    buyerUserId: str(o.buyerUserId),
    buyerDisplayName: o.buyerDisplayName == null ? null : str(o.buyerDisplayName) || null,
    buyerAvatarUrl: o.buyerAvatarUrl == null ? null : str(o.buyerAvatarUrl) || null,
    partnerUserId: str(o.partnerUserId),
    beneficiaryUserId: str(o.beneficiaryUserId),
    peaksCharged: num(o.peaksCharged),
    basePeaks: num(o.basePeaks),
    communityFeePeaks: num(o.communityFeePeaks),
    discountPercent: num(o.discountPercent),
    countryCode: str(o.countryCode),
    regionId: str(o.regionId),
    regionName: o.regionName == null ? null : str(o.regionName),
    createdAt: str(o.createdAt),
  };
}

export function normalizeAdminPeaksTransactionsPage(
  raw: unknown,
): AdminPeaksTransactionsPageDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const items: AdminPeaksTransactionDto[] = [];
  for (const item of o.items) {
    const dto = normalizeAdminPeaksTransaction(item);
    if (dto) items.push(dto);
  }
  return {
    items,
    nextCursor: o.nextCursor == null ? null : str(o.nextCursor) || null,
  };
}

export function normalizeAdminPeaksGeoRow(raw: unknown): AdminPeaksGeoRowDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    countryCode: o.countryCode == null ? undefined : str(o.countryCode),
    regionId: o.regionId == null ? undefined : str(o.regionId),
    regionName: o.regionName == null ? null : str(o.regionName) || null,
    transactionCount: num(o.transactionCount),
    communityFeePeaks: num(o.communityFeePeaks),
    partnerPeaks: num(o.partnerPeaks),
    totalPeaksCharged: num(o.totalPeaksCharged),
  };
}

export function normalizeAdminPeaksGeoList(raw: unknown): AdminPeaksGeoRowDto[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminPeaksGeoRowDto[] = [];
  for (const item of raw) {
    const dto = normalizeAdminPeaksGeoRow(item);
    if (dto) out.push(dto);
  }
  return out;
}
