export type VolumeDiscountTier = {
  minVideos: number;
  discountPercent: number;
};

export type CommercialSettings = {
  videoPricePeaks: number;
  volumeDiscounts: VolumeDiscountTier[];
};

export const DEFAULT_COMMERCIAL_SETTINGS: CommercialSettings = {
  videoPricePeaks: 50,
  volumeDiscounts: [
    { minVideos: 3, discountPercent: 10 },
    { minVideos: 5, discountPercent: 15 },
    { minVideos: 10, discountPercent: 20 },
  ],
};

export function normalizeCommercialSettings(raw: unknown): CommercialSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const videoPricePeaks = Number(o.videoPricePeaks);
  if (!Number.isFinite(videoPricePeaks) || videoPricePeaks < 1) return null;
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
  return { videoPricePeaks: Math.round(videoPricePeaks), volumeDiscounts };
}

export const COMMUNITY_FEE_PERCENT = 20;

export type CheckoutPeaksBreakdown = {
  basePeaks: number;
  communityFeePeaks: number;
  totalPeaks: number;
  communityFeePercent: number;
  listPricePeaks: number;
  discountPercent: number;
  discountPeaksSaved: number;
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

export function computeBuyClaimPeaks(
  settings: CommercialSettings,
  quantity: number,
): { unitPricePeaks: number; discountPercent: number; totalPeaks: number } {
  const q = Math.max(1, Math.floor(quantity));
  const unitPricePeaks = settings.videoPricePeaks;
  const discountPercent = volumeDiscountPercent(q, settings.volumeDiscounts);
  const subtotal = unitPricePeaks * q;
  const totalPeaks = Math.max(
    1,
    Math.round(subtotal * (1 - discountPercent / 100)),
  );
  return { unitPricePeaks, discountPercent, totalPeaks };
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

export function allocateBuyClaimLineBreakdowns(
  settings: CommercialSettings,
  waveCount: number,
): CheckoutPeaksBreakdown[] {
  const q = Math.max(1, Math.floor(waveCount));
  const { unitPricePeaks, discountPercent, totalPeaks: discountedBaseTotal } =
    computeBuyClaimPeaks(settings, q);
  const baseShares = splitIntegerTotal(discountedBaseTotal, q);
  return baseShares.map((basePeaks) => {
    const checkout = computeCheckoutTotal(basePeaks);
    const list = unitPricePeaks;
    return {
      ...checkout,
      listPricePeaks: list,
      discountPercent,
      discountPeaksSaved: Math.max(0, list - basePeaks),
    };
  });
}

export function computeCheckoutTotal(basePeaks: number): CheckoutPeaksBreakdown {
  const base = Math.max(0, Math.round(basePeaks));
  const communityFeePeaks = Math.max(
    1,
    Math.round((base * COMMUNITY_FEE_PERCENT) / 100),
  );
  return {
    basePeaks: base,
    communityFeePeaks,
    totalPeaks: base + communityFeePeaks,
    communityFeePercent: COMMUNITY_FEE_PERCENT,
    listPricePeaks: base,
    discountPercent: 0,
    discountPeaksSaved: 0,
  };
}

export function formatDiscountSummary(settings: CommercialSettings): string {
  const tiers = settings.volumeDiscounts;
  if (tiers.length === 0) {
    return `${settings.videoPricePeaks} Peaks per wave`;
  }
  const parts = tiers.map(
    (t) => `${t.minVideos}+ waves: ${t.discountPercent}% off`,
  );
  return `${settings.videoPricePeaks} Peaks/wave · ${parts.join(" · ")}`;
}
