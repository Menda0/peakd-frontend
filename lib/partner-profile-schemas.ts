import { z } from "zod";
import {
  DEFAULT_COMMERCIAL_SETTINGS,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import {
  currencyDecimals,
  isSupportedCurrency,
  majorToMinor,
  minorToMajor,
  normalizeCurrency,
  SUPPORTED_CURRENCIES,
} from "@/lib/currencies";
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

/** Generous cap that mirrors the API-side `MAX_VIDEO_PRICE`. */
const MAX_VIDEO_PRICE_MAJOR = 1_000_000;

export const partnerCommercialFormSchema = z.object({
  currency: z
    .string()
    .min(1, "Currency is required")
    .refine(
      (v) => isSupportedCurrency(v),
      "Currency must be one of the supported ISO 4217 codes",
    ),
  videoPriceMajor: z.string().superRefine((val, ctx) => {
    const trimmed = val.trim().replace(",", ".");
    if (trimmed === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price per wave is required",
      });
      return;
    }
    if (!/^\d+(?:\.\d{1,4})?$/.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a positive amount (e.g. 5 or 4.99)",
      });
      return;
    }
    const n = Number.parseFloat(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be greater than 0",
      });
      return;
    }
    if (n > MAX_VIDEO_PRICE_MAJOR) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Price must be at most ${MAX_VIDEO_PRICE_MAJOR.toLocaleString()}`,
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

export type PartnerCommercialFormValues = z.infer<
  typeof partnerCommercialFormSchema
>;

export const SUPPORTED_PRICING_CURRENCIES = SUPPORTED_CURRENCIES;

/**
 * Convert the form's string price into integer minor units of the selected
 * currency. The form already validated the input, but we re-check to be
 * defensive against callers bypassing zod.
 */
export function commercialFormToSettings(
  values: PartnerCommercialFormValues,
): {
  currency: string;
  videoPriceMinor: number;
  volumeDiscounts: Array<{ minVideos: number; discountPercent: number }>;
} {
  const currency = normalizeCurrency(values.currency);
  const major = Number.parseFloat(values.videoPriceMajor.trim().replace(",", "."));
  const videoPriceMinor = Number.isFinite(major)
    ? Math.max(1, majorToMinor(major, currency))
    : 0;
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
  return { currency, videoPriceMinor, volumeDiscounts };
}

export function commercialSettingsForForm(
  saved: CommercialSettings | null,
): CommercialSettings {
  return saved ?? DEFAULT_COMMERCIAL_SETTINGS;
}

export function commercialSettingsToFormValues(
  settings: CommercialSettings | null,
): PartnerCommercialFormValues {
  const effective = commercialSettingsForForm(settings);
  const major = minorToMajor(effective.videoPriceMinor, effective.currency);
  const decimals = currencyDecimals(effective.currency);
  return {
    currency: effective.currency,
    videoPriceMajor: major.toFixed(decimals),
    volumeDiscounts: effective.volumeDiscounts.map((t) => ({
      minVideos: String(t.minVideos),
      discountPercent: String(t.discountPercent),
    })),
  };
}
