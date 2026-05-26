import { z } from "zod";
import {
  DEFAULT_COMMERCIAL_SETTINGS,
  eurStringFromPeaks,
  peaksFromEurInput,
} from "@/lib/commercial-settings";
import { PARTNER_TYPES } from "@/lib/partner-profile";

export const partnerProfileFormSchema = z.object({
  partnerName: z.string(),
  partnerType: z.enum(PARTNER_TYPES),
  descriptionMarkdown: z.string(),
  countryCode: z.string().nullable(),
});

export type PartnerProfileFormValues = z.infer<typeof partnerProfileFormSchema>;

const tierSchema = z.object({
  minVideos: z.string(),
  discountPercent: z.string(),
});

/**
 * Maximum video price the partner can configure (€10,000). Mirrors the API-side
 * `MAX_VIDEO_PRICE` ceiling once converted into Peaks at any reasonable rate.
 */
const MAX_VIDEO_PRICE_EUR = 10_000;

export const partnerCommercialFormSchema = z.object({
  videoPriceEur: z.string().superRefine((val, ctx) => {
    const trimmed = val.trim().replace(",", ".");
    if (trimmed === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price per wave is required",
      });
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a euro amount (e.g. 5 or 4.99)",
      });
      return;
    }
    const n = Number.parseFloat(trimmed);
    if (!Number.isFinite(n) || n < 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be at least €0.01",
      });
      return;
    }
    if (n > MAX_VIDEO_PRICE_EUR) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Price must be at most €${MAX_VIDEO_PRICE_EUR.toLocaleString()}`,
      });
    }
  }),
  volumeDiscounts: z.array(tierSchema).superRefine((tiers, ctx) => {
    const seen = new Set<number>();
    tiers.forEach((tier, index) => {
      const minRaw = tier.minVideos.trim();
      const pctRaw = tier.discountPercent.trim();
      if (minRaw === "" && pctRaw === "") return;
      if (minRaw === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum waves is required",
          path: [index, "minVideos"],
        });
      } else {
        const min = Number.parseInt(minRaw, 10);
        if (!Number.isFinite(min) || !Number.isInteger(min) || min < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Minimum must be at least 2",
            path: [index, "minVideos"],
          });
        } else if (seen.has(min)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate minimum wave count",
            path: [index, "minVideos"],
          });
        } else {
          seen.add(min);
        }
      }
      if (pctRaw === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount percent is required",
          path: [index, "discountPercent"],
        });
      } else {
        const pct = Number.parseInt(pctRaw, 10);
        if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Discount must be between 0 and 90",
            path: [index, "discountPercent"],
          });
        }
      }
    });
  }),
});

export type PartnerCommercialFormValues = z.infer<typeof partnerCommercialFormSchema>;

/**
 * Convert the EUR-denominated form into the persisted shape (Peaks). Buyers
 * still pay in Peaks, so the storage unit doesn't change — the partner UI is
 * the only layer that thinks in euros.
 */
export function commercialFormToSettings(
  values: PartnerCommercialFormValues,
  peaksPerEuro: number,
): {
  videoPricePeaks: number;
  volumeDiscounts: Array<{ minVideos: number; discountPercent: number }>;
} {
  const videoPricePeaks =
    peaksFromEurInput(values.videoPriceEur, peaksPerEuro) ?? 0;
  const volumeDiscounts = values.volumeDiscounts
    .filter(
      (t) => t.minVideos.trim() !== "" || t.discountPercent.trim() !== "",
    )
    .map((t) => ({
      minVideos: Number.parseInt(t.minVideos.trim(), 10),
      discountPercent: Number.parseInt(t.discountPercent.trim(), 10),
    }))
    .filter(
      (t) =>
        Number.isFinite(t.minVideos) &&
        Number.isFinite(t.discountPercent) &&
        t.minVideos >= 2,
    )
    .sort((a, b) => a.minVideos - b.minVideos);
  return { videoPricePeaks, volumeDiscounts };
}

/** Suggested defaults when the partner has not saved commercial settings yet. */
export function commercialSettingsForForm(
  saved: {
    videoPricePeaks: number;
    volumeDiscounts: Array<{ minVideos: number; discountPercent: number }>;
  } | null,
) {
  return saved ?? DEFAULT_COMMERCIAL_SETTINGS;
}

export function commercialSettingsToFormValues(
  settings: {
    videoPricePeaks: number;
    volumeDiscounts: Array<{ minVideos: number; discountPercent: number }>;
  } | null,
  peaksPerEuro: number,
): PartnerCommercialFormValues {
  const effective = commercialSettingsForForm(settings);
  return {
    videoPriceEur: eurStringFromPeaks(effective.videoPricePeaks, peaksPerEuro),
    volumeDiscounts: effective.volumeDiscounts.map((t) => ({
      minVideos: String(t.minVideos),
      discountPercent: String(t.discountPercent),
    })),
  };
}
