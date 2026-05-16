/**
 * SPA-only: after the user dismisses the onboarding modal, do not auto-open it again
 * until a full page load (refresh, direct URL entry, new tab). sessionStorage survives
 * soft client navigations but is cleared on the first profile bootstrap of a new document.
 */
const SPA_ONBOARDING_DISMISS_KEY = "peakd:user-profile:onboarding-spa-dismiss";

export function isSpaOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SPA_ONBOARDING_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSpaOnboardingDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SPA_ONBOARDING_DISMISS_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/** Cleared once per full page load on first bootstrap (see UserProfileProvider). */
export function clearSpaOnboardingDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SPA_ONBOARDING_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
