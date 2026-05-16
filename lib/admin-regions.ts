export type AdminRegionDto = {
  regionId: string;
  countryCode: string;
  name: string;
  verified: boolean;
  verifiedAt: string | null;
  verifierCount: number;
  disabled: boolean;
  createdByUserId: string;
  createdAt: string;
};

export function normalizeAdminRegionDto(raw: unknown): AdminRegionDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.regionId !== "string" || typeof o.countryCode !== "string") {
    return null;
  }
  if (typeof o.name !== "string") return null;
  return {
    regionId: o.regionId,
    countryCode: o.countryCode,
    name: o.name,
    verified: o.verified === true,
    verifiedAt: o.verifiedAt == null ? null : String(o.verifiedAt),
    verifierCount: typeof o.verifierCount === "number" ? o.verifierCount : 0,
    disabled: o.disabled === true,
    createdByUserId: String(o.createdByUserId ?? ""),
    createdAt: String(o.createdAt ?? ""),
  };
}

export function normalizeAdminRegionList(raw: unknown): AdminRegionDto[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminRegionDto[] = [];
  for (const item of raw) {
    const dto = normalizeAdminRegionDto(item);
    if (dto) out.push(dto);
  }
  return out;
}

export const ADMIN_REGIONS_PATH = "admin/regions";
