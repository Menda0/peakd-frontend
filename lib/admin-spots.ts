export type AdminSpotDto = {
  spotId: string;
  regionId: string;
  name: string;
  level: string | null;
  breakType: string | null;
  consistency: string | null;
  verified: boolean;
  verifiedAt: string | null;
  verifierCount: number;
  disabled: boolean;
  createdByUserId: string;
  createdAt: string;
};

export function normalizeAdminSpotDto(raw: unknown): AdminSpotDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.spotId !== "string" || typeof o.regionId !== "string") {
    return null;
  }
  if (typeof o.name !== "string") return null;
  return {
    spotId: o.spotId,
    regionId: o.regionId,
    name: o.name,
    level: o.level == null ? null : String(o.level),
    breakType: o.breakType == null ? null : String(o.breakType),
    consistency: o.consistency == null ? null : String(o.consistency),
    verified: o.verified === true,
    verifiedAt: o.verifiedAt == null ? null : String(o.verifiedAt),
    verifierCount: typeof o.verifierCount === "number" ? o.verifierCount : 0,
    disabled: o.disabled === true,
    createdByUserId: String(o.createdByUserId ?? ""),
    createdAt: String(o.createdAt ?? ""),
  };
}

export function normalizeAdminSpotList(raw: unknown): AdminSpotDto[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminSpotDto[] = [];
  for (const item of raw) {
    const dto = normalizeAdminSpotDto(item);
    if (dto) out.push(dto);
  }
  return out;
}
