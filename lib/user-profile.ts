/** DTO aligned with Nest `GET/PATCH /users/me` (app user profile; not partner profile). */

export const SURF_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type SurfLevel = (typeof SURF_LEVELS)[number];

export type UserProfileDto = {
  displayName: string | null;
  nickname: string | null;
  countryCode: string | null;
  homeRegionId: string | null;
  surfLevel: SurfLevel | null;
  /** UTC YYYY-MM-DD when onboarding prompt was last recorded (server). */
  onboardingPromptDayUtc: string | null;
};

export const USER_PROFILE_PATH = "users/me";
export const USER_ONBOARDING_PROMPT_PATH = "users/me/onboarding-prompt";

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
    surfLevel,
    onboardingPromptDayUtc:
      o.onboardingPromptDayUtc == null || o.onboardingPromptDayUtc === ""
        ? null
        : String(o.onboardingPromptDayUtc),
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
