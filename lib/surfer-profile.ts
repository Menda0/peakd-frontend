import type { SurfLevel } from "@/lib/user-profile";
import { isSurfLevel } from "@/lib/user-profile";

export type SurferProfile = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  surfLevel: SurfLevel | null;
  countryCode: string | null;
  regionName: string | null;
};

export function normalizeSurferProfile(raw: unknown): SurferProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.userId !== "string") return null;
  return {
    userId: o.userId,
    displayName: o.displayName == null ? null : String(o.displayName),
    avatarUrl: o.avatarUrl == null ? null : String(o.avatarUrl),
    surfLevel: isSurfLevel(o.surfLevel) ? o.surfLevel : null,
    countryCode: o.countryCode == null ? null : String(o.countryCode),
    regionName: o.regionName == null ? null : String(o.regionName),
  };
}
