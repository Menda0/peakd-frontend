"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { UserProfileModal, type UserProfileModalMode } from "@/components/user-profile/user-profile-modal";
import { getUserProfileAction } from "@/lib/user-profile-actions";
import {
  clearOnboardingPromptCookie,
  hasOnboardingPromptCookieForToday,
  setOnboardingPromptCookieDay,
} from "@/lib/user-profile-onboarding-cookie";
import {
  clearSpaOnboardingDismissed,
  isSpaOnboardingDismissed,
  setSpaOnboardingDismissed,
} from "@/lib/user-profile-onboarding-session";
import {
  needsUserProfileOnboarding,
  type UserProfileDto,
  utcCalendarDayString,
} from "@/lib/user-profile";

export type UserProfileModalApi = {
  openProfileSettings: () => Promise<void>;
};

const UserProfileModalContext = createContext<UserProfileModalApi | null>(null);

export function useUserProfileModal(): UserProfileModalApi {
  const ctx = useContext(UserProfileModalContext);
  if (!ctx) {
    throw new Error("useUserProfileModal must be used within UserProfileProvider");
  }
  return ctx;
}

type Auth0UserProps = {
  name?: string | null;
  given_name?: string | null;
  email?: string | null;
  picture?: string | null;
};

type ModalMode = "closed" | UserProfileModalMode;

type ProfileOk = { ok: true; data: UserProfileDto };

function applyProfileLoadError(
  setLoadError: (e: string | null) => void,
  setProfile: (p: UserProfileDto | null) => void,
  setModalMode: React.Dispatch<React.SetStateAction<ModalMode>>,
  error: string,
) {
  setLoadError(error);
  setProfile(null);
  setModalMode((m) => (m === "settings" ? m : "onboarding"));
}

/**
 * After a successful GET /users/me: set profile, then either open onboarding (at most once per UTC day
 * in this browser via cookie) or keep the modal closed.
 */
function applySuccessfulProfileBootstrap(
  res: ProfileOk,
  auth0User: Auth0UserProps,
  incompleteOnboardingDismissedThisMount: boolean,
  setLoadError: (e: string | null) => void,
  setProfile: (p: UserProfileDto | null) => void,
  setModalMode: React.Dispatch<React.SetStateAction<ModalMode>>,
): void {
  const needs = needsUserProfileOnboarding(res.data, auth0User);
  const promptedToday = hasOnboardingPromptCookieForToday();

  setLoadError(null);
  setProfile(res.data);

  if (!needs) {
    clearSpaOnboardingDismissed();
    setModalMode((m) => (m === "settings" ? m : "closed"));
    return;
  }

  if (incompleteOnboardingDismissedThisMount) {
    setModalMode((m) => (m === "settings" ? m : "closed"));
    return;
  }

  if (isSpaOnboardingDismissed()) {
    setModalMode((m) => (m === "settings" ? m : "closed"));
    return;
  }

  if (promptedToday) {
    setModalMode((m) => (m === "settings" ? m : "closed"));
    return;
  }

  const today = utcCalendarDayString();
  setOnboardingPromptCookieDay(today);
  setModalMode((m) => (m === "settings" ? m : "onboarding"));
}

export function UserProfileProvider({
  children,
  auth0User,
}: {
  children: ReactNode;
  auth0User: Auth0UserProps;
}) {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  /** After user dismisses incomplete onboarding, do not auto-open again until next full page load. */
  const incompleteOnboardingDismissedThisMount = useRef(false);
  /** First bootstrap run per document clears SPA dismiss so refresh can re-evaluate the onboarding cookie. */
  const bootstrapGeneration = useRef(0);

  useEffect(() => {
    bootstrapGeneration.current += 1;
    const isFirstBootstrapRun = bootstrapGeneration.current === 1;
    let cancelled = false;
    (async () => {
      if (isFirstBootstrapRun) {
        clearSpaOnboardingDismissed();
      }
      const res = await getUserProfileAction();
      if (cancelled) return;
      if (!res.ok) {
        applyProfileLoadError(setLoadError, setProfile, setModalMode, res.error);
        return;
      }
      applySuccessfulProfileBootstrap(
        res,
        auth0User,
        incompleteOnboardingDismissedThisMount.current,
        setLoadError,
        setProfile,
        setModalMode,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [auth0User.name, auth0User.given_name, auth0User.email, auth0User.picture]);

  const reloadProfile = useCallback(async () => {
    const res = await getUserProfileAction();
    if (!res.ok) {
      applyProfileLoadError(setLoadError, setProfile, setModalMode, res.error);
      return;
    }
    applySuccessfulProfileBootstrap(
      res,
      auth0User,
      incompleteOnboardingDismissedThisMount.current,
      setLoadError,
      setProfile,
      setModalMode,
    );
  }, [auth0User]);

  const openProfileSettings = useCallback(async (): Promise<void> => {
    try {
      const res = await getUserProfileAction();
      if (!res.ok) {
        setLoadError(res.error);
        setProfile(null);
        setModalMode("settings");
        return;
      }
      setLoadError(null);
      setProfile(res.data);
      setModalMode("settings");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to open profile");
      setModalMode("settings");
    }
  }, []);

  const ctx = useMemo<UserProfileModalApi>(
    () => ({
      openProfileSettings,
    }),
    [openProfileSettings],
  );

  const handleDismissModal = useCallback(() => {
    setModalMode((prev) => {
      if (prev !== "settings" && prev !== "onboarding") return prev;
      if (prev === "onboarding") {
        incompleteOnboardingDismissedThisMount.current = true;
        setSpaOnboardingDismissed();
        setOnboardingPromptCookieDay(utcCalendarDayString());
      }
      return "closed";
    });
  }, []);

  const handleProfileSnapshot = useCallback((dto: UserProfileDto) => {
    setProfile(dto);
    setLoadError(null);
  }, []);

  const handleSaved = useCallback(
    (dto: UserProfileDto) => {
      setProfile(dto);
      setLoadError(null);
      if (!needsUserProfileOnboarding(dto, auth0User)) {
        incompleteOnboardingDismissedThisMount.current = false;
        clearSpaOnboardingDismissed();
        clearOnboardingPromptCookie();
      }
      setModalMode((prev) => {
        if (prev === "settings") return "closed";
        if (!needsUserProfileOnboarding(dto, auth0User)) return "closed";
        return prev;
      });
    },
    [auth0User],
  );

  const open = modalMode !== "closed";
  const uiMode: UserProfileModalMode = modalMode === "settings" ? "settings" : "onboarding";

  return (
    <UserProfileModalContext.Provider value={ctx}>
      {children}
      <UserProfileModal
        open={open}
        mode={uiMode}
        profile={profile}
        auth0User={auth0User}
        loadError={loadError}
        onClose={handleDismissModal}
        onSaved={handleSaved}
        onProfileSnapshot={handleProfileSnapshot}
        onRetry={() => void reloadProfile()}
      />
    </UserProfileModalContext.Provider>
  );
}
