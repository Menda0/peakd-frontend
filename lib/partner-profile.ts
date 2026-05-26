/** DTO aligned with Nest `GET/PATCH /partners/me` and `POST /partners/me/avatar` (multipart). */

import {
  normalizeCommercialSettings,
  type CommercialSettings,
} from "@/lib/commercial-settings";

export const PARTNER_TYPES = ["videographer", "coach", "other"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export type PartnerProfileDto = {
  partnerName: string | null;
  partnerType: PartnerType;
  descriptionMarkdown: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  commercialSettings: CommercialSettings | null;
  /**
   * Current Peaks-per-EUR exchange rate. Partners enter their video price in
   * EUR on the commercial tab; the value is stored in Peaks (so buyer checkout
   * is unchanged) and converted in both directions with this rate.
   */
  peaksPerEuro: number;
};

export const DEFAULT_PEAKS_PER_EURO_FALLBACK = 100;

export type PartnerProfilePatch = Partial<PartnerProfileDto>;

export const PARTNER_PROFILE_PATH = "partners/me";
export const PARTNER_AVATAR_UPLOAD_PATH = "partners/me/avatar";

export function isPartnerType(value: unknown): value is PartnerType {
  return typeof value === "string" && (PARTNER_TYPES as readonly string[]).includes(value);
}

export function normalizePartnerProfileDto(raw: unknown): PartnerProfileDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const partnerType: PartnerType = isPartnerType(o.partnerType) ? o.partnerType : "other";
  const peaksPerEuroRaw = Number(o.peaksPerEuro);
  const peaksPerEuro =
    Number.isFinite(peaksPerEuroRaw) && peaksPerEuroRaw > 0
      ? Math.floor(peaksPerEuroRaw)
      : DEFAULT_PEAKS_PER_EURO_FALLBACK;
  return {
    partnerName: o.partnerName == null ? null : String(o.partnerName),
    partnerType,
    descriptionMarkdown: o.descriptionMarkdown == null ? null : String(o.descriptionMarkdown),
    avatarUrl: o.avatarUrl == null ? null : String(o.avatarUrl),
    countryCode: o.countryCode == null ? null : String(o.countryCode),
    commercialSettings: normalizeCommercialSettings(o.commercialSettings),
    peaksPerEuro,
  };
}
