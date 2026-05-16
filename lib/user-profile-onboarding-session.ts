/** Session flag: we already auto-opened the onboarding modal once this tab (survives layout remounts). */
const ONBOARDING_DEBUT_KEY = "peakd:user-profile:onboarding-debut";

export function hasConsumedOnboardingDebut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ONBOARDING_DEBUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Call when we decide to auto-show onboarding so it will not re-open on every client navigation. */
export function consumeOnboardingDebut(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ONBOARDING_DEBUT_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/** Clear when profile is complete so a future incomplete state can prompt again in a new session. */
export function clearOnboardingDebut(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ONBOARDING_DEBUT_KEY);
  } catch {
    /* ignore */
  }
}
