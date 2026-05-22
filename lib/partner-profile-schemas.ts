import { z } from "zod";
import { DEFAULT_COMMERCIAL_SETTINGS } from "@/lib/commercial-settings";
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

export const partnerCommercialFormSchema = z.object({
  videoPricePeaks: z.string().superRefine((val, ctx) => {
    const trimmed = val.trim();
    if (trimmed === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price per wave is required",
      });
      return;
    }
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid price of at least 1 Peak",
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

export function commercialFormToSettings(
  values: PartnerCommercialFormValues,
): {
  videoPricePeaks: number;
  volumeDiscounts: Array<{ minVideos: number; discountPercent: number }>;
} {
  const videoPricePeaks = Number.parseInt(values.videoPricePeaks.trim(), 10);
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
): PartnerCommercialFormValues {
  const effective = commercialSettingsForForm(settings);
  return {
    videoPricePeaks: String(effective.videoPricePeaks),
    volumeDiscounts: effective.volumeDiscounts.map((t) => ({
      minVideos: String(t.minVideos),
      discountPercent: String(t.discountPercent),
    })),
  };
}
