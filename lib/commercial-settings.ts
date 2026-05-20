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
