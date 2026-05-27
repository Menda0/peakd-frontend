import {
  formatMoney,
  isSupportedCurrency,
  normalizeCurrency,
} from "@/lib/currencies";

export type VolumeDiscountTier = {
  minVideos: number;
  discountPercent: number;
};

export type CommercialSettings = {
  /** Uppercase ISO 4217 currency code, e.g. "EUR". */
  currency: string;
  /** Integer minor units of `currency` (e.g. cents). */
  videoPriceMinor: number;
  volumeDiscounts: VolumeDiscountTier[];
};

export const DEFAULT_COMMERCIAL_SETTINGS: CommercialSettings = {
  currency: "EUR",
  videoPriceMinor: 500,
  volumeDiscounts: [
    { minVideos: 3, discountPercent: 10 },
    { minVideos: 5, discountPercent: 15 },
    { minVideos: 10, discountPercent: 20 },
  ],
};

export function normalizeCommercialSettings(
  raw: unknown,
): CommercialSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const currencyRaw =
    typeof o.currency === "string" ? normalizeCurrency(o.currency) : "";
  if (!currencyRaw || !isSupportedCurrency(currencyRaw)) return null;
  const videoPriceMinor = Number(o.videoPriceMinor);
  if (
    !Number.isFinite(videoPriceMinor) ||
    !Number.isInteger(videoPriceMinor) ||
    videoPriceMinor < 1
  ) {
    return null;
  }
  const volumeDiscounts: VolumeDiscountTier[] = [];
  if (Array.isArray(o.volumeDiscounts)) {
    for (const row of o.volumeDiscounts) {
      if (!row || typeof row !== "object") continue;
      const t = row as Record<string, unknown>;
      const minVideos = Number(t.minVideos);
      const discountPercent = Number(t.discountPercent);
      if (
        Number.isFinite(minVideos) &&
        Number.isInteger(minVideos) &&
        minVideos >= 2 &&
        Number.isFinite(discountPercent) &&
        discountPercent >= 0 &&
        discountPercent <= 90
      ) {
        volumeDiscounts.push({ minVideos, discountPercent });
      }
    }
  }
  volumeDiscounts.sort((a, b) => a.minVideos - b.minVideos);
  return {
    currency: currencyRaw,
    videoPriceMinor: Math.round(videoPriceMinor),
    volumeDiscounts,
  };
}

/** Default platform commission percent charged on top of the partner's price. */
export const PLATFORM_COMMISSION_PERCENT_DEFAULT = 20;

export type CheckoutBreakdownMinor = {
  basePriceMinor: number;
  commissionMinor: number;
  totalMinor: number;
  commissionPercent: number;
  listPriceMinor: number;
  discountPercent: number;
  discountSavedMinor: number;
};

export function volumeDiscountPercent(
  quantity: number,
  tiers: VolumeDiscountTier[],
): number {
  if (quantity < 1 || tiers.length === 0) return 0;
  let best = 0;
  for (const tier of tiers) {
    if (quantity >= tier.minVideos && tier.discountPercent > best) {
      best = tier.discountPercent;
    }
  }
  return best;
}

export function computeBuyClaimMinor(
  settings: CommercialSettings,
  quantity: number,
): { unitPriceMinor: number; discountPercent: number; totalMinor: number } {
  const q = Math.max(1, Math.floor(quantity));
  const unitPriceMinor = settings.videoPriceMinor;
  const discountPercent = volumeDiscountPercent(q, settings.volumeDiscounts);
  const subtotal = unitPriceMinor * q;
  const totalMinor = Math.max(
    1,
    Math.round(subtotal * (1 - discountPercent / 100)),
  );
  return { unitPriceMinor, discountPercent, totalMinor };
}

function splitIntegerTotal(total: number, parts: number): number[] {
  const n = Math.max(1, Math.floor(parts));
  const sum = Math.max(0, Math.round(total));
  const base = Math.floor(sum / n);
  let remainder = sum - base * n;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    out.push(base + extra);
  }
  return out;
}

export function computeCheckoutTotalMinor(
  basePriceMinor: number,
  commissionPercent: number = PLATFORM_COMMISSION_PERCENT_DEFAULT,
): CheckoutBreakdownMinor {
  const base = Math.max(0, Math.round(basePriceMinor));
  const pct = Math.max(0, commissionPercent);
  const commissionMinor =
    base > 0 ? Math.max(1, Math.round((base * pct) / 100)) : 0;
  return {
    basePriceMinor: base,
    commissionMinor,
    totalMinor: base + commissionMinor,
    commissionPercent: pct,
    listPriceMinor: base,
    discountPercent: 0,
    discountSavedMinor: 0,
  };
}

export function allocateBuyClaimLineBreakdownsMinor(
  settings: CommercialSettings,
  waveCount: number,
  commissionPercent: number = PLATFORM_COMMISSION_PERCENT_DEFAULT,
): CheckoutBreakdownMinor[] {
  const q = Math.max(1, Math.floor(waveCount));
  const {
    unitPriceMinor,
    discountPercent,
    totalMinor: discountedBaseTotal,
  } = computeBuyClaimMinor(settings, q);
  const baseShares = splitIntegerTotal(discountedBaseTotal, q);
  return baseShares.map((basePriceMinor) => {
    const checkout = computeCheckoutTotalMinor(
      basePriceMinor,
      commissionPercent,
    );
    return {
      ...checkout,
      listPriceMinor: unitPriceMinor,
      discountPercent,
      discountSavedMinor: Math.max(0, unitPriceMinor - basePriceMinor),
    };
  });
}

export function formatDiscountSummary(settings: CommercialSettings): string {
  const price = formatMoney(settings.videoPriceMinor, settings.currency);
  const tiers = settings.volumeDiscounts;
  if (tiers.length === 0) {
    return `${price} per wave`;
  }
  const parts = tiers.map(
    (t) => `${t.minVideos}+ waves: ${t.discountPercent}% off`,
  );
  return `${price}/wave · ${parts.join(" · ")}`;
}
