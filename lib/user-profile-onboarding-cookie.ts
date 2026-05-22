function utcDayString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

const COOKIE_NAME = "peakd_onboarding_prompt";

/** `YYYY-MM-DD` UTC — value stored in the cookie. */
function parseCookieDay(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const rows = document.cookie.split("; ");
    for (const row of rows) {
      if (row.startsWith(`${COOKIE_NAME}=`)) {
        const v = decodeURIComponent(row.slice(COOKIE_NAME.length + 1)).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Last UTC calendar day stored in the cookie, if any. */
export function getOnboardingPromptCookieDay(): string | null {
  return parseCookieDay();
}

/** True when the cookie is set to today’s UTC date (already prompted today in this browser). */
export function hasOnboardingPromptCookieForToday(): boolean {
  return parseCookieDay() === utcDayString();
}

/** Persist the UTC day we showed or dismissed the onboarding prompt (browser only). */
export function setOnboardingPromptCookieDay(day: string): void {
  if (typeof document === "undefined") return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const maxAge = 60 * 60 * 24 * 400;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(day)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearOnboardingPromptCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
