/** DTO aligned with Nest `GET/PATCH /partners/me` and `POST /partners/me/avatar/presign`. */

export const PARTNER_TYPES = ["videographer", "coach", "other"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export type PartnerProfileDto = {
  partnerName: string | null;
  partnerType: PartnerType;
  descriptionMarkdown: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
};

export type PartnerProfilePatch = Partial<PartnerProfileDto>;

export type AvatarPresignRequestBody = {
  contentType: string;
  filename?: string;
};

export type AvatarPresignResponse = {
  uploadUrl: string;
  method: string;
  headers?: Record<string, string>;
  /** Persisted on the profile after a successful S3 PUT (MongoDB stores the key). */
  avatarKey: string;
  /** Display URL for this key (presigned GET or public base URL); matches GET /partners/me. */
  avatarUrl: string;
};

export const PARTNER_PROFILE_PATH = "partners/me";
export const PARTNER_AVATAR_PRESIGN_PATH = "partners/me/avatar/presign";

export function isPartnerType(value: unknown): value is PartnerType {
  return typeof value === "string" && (PARTNER_TYPES as readonly string[]).includes(value);
}

export function normalizePartnerProfileDto(raw: unknown): PartnerProfileDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const partnerType: PartnerType = isPartnerType(o.partnerType) ? o.partnerType : "other";
  return {
    partnerName: o.partnerName == null ? null : String(o.partnerName),
    partnerType,
    descriptionMarkdown: o.descriptionMarkdown == null ? null : String(o.descriptionMarkdown),
    avatarUrl: o.avatarUrl == null ? null : String(o.avatarUrl),
    countryCode: o.countryCode == null ? null : String(o.countryCode),
  };
}
