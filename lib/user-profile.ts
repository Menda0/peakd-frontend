/** DTO aligned with Nest `GET/PATCH /users/me` (app user profile; not partner profile). */

export const SURF_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type SurfLevel = (typeof SURF_LEVELS)[number];

export type UserProfileDto = {
  displayName: string | null;
  nickname: string | null;
  countryCode: string | null;
  homeRegionId: string | null;
  homeRegionName: string | null;
  surfLevel: SurfLevel | null;
  avatarUrl: string | null;
};

export const USER_PROFILE_PATH = "users/me";
export const USER_AVATAR_UPLOAD_PATH = "users/me/avatar";

/** UTC calendar day `YYYY-MM-DD` (e.g. cookie / comparisons). */
export function utcCalendarDayString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isSurfLevel(value: unknown): value is SurfLevel {
  return typeof value === "string" && (SURF_LEVELS as readonly string[]).includes(value);
}

export function normalizeUserProfileDto(raw: unknown): UserProfileDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const surfLevel: SurfLevel | null = isSurfLevel(o.surfLevel) ? o.surfLevel : null;
  return {
    displayName: o.displayName == null ? null : String(o.displayName),
    nickname: o.nickname == null ? null : String(o.nickname),
    countryCode: o.countryCode == null ? null : String(o.countryCode),
    homeRegionId: o.homeRegionId == null ? null : String(o.homeRegionId),
    homeRegionName: o.homeRegionName == null ? null : String(o.homeRegionName),
    surfLevel,
    avatarUrl: o.avatarUrl == null ? null : String(o.avatarUrl),
  };
}

export function auth0DisplayNameHint(user: {
  name?: string | null;
  given_name?: string | null;
}): string {
  const n = typeof user.name === "string" ? user.name.trim() : "";
  if (n) return n;
  const g = typeof user.given_name === "string" ? user.given_name.trim() : "";
  return g;
}

export function auth0HasDisplayName(user: {
  name?: string | null;
  given_name?: string | null;
}): boolean {
  return auth0DisplayNameHint(user).length > 0;
}

export function needsUserProfileOnboarding(
  profile: UserProfileDto,
  auth0User: { name?: string | null; given_name?: string | null },
): boolean {
  const countryOk = Boolean(profile.countryCode?.trim());
  const nameOk =
    Boolean(profile.displayName?.trim()) || auth0HasDisplayName(auth0User);
  return !countryOk || !nameOk;
}
