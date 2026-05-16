"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { UserProfileModal, type UserProfileModalMode } from "@/components/user-profile/user-profile-modal";
import {
  getUserProfileAction,
  recordOnboardingPromptAction,
} from "@/lib/user-profile-actions";
import {
  clearSpaOnboardingDismissed,
  isSpaOnboardingDismissed,
  setSpaOnboardingDismissed,
} from "@/lib/user-profile-onboarding-session";
import {
  needsUserProfileOnboarding,
  type UserProfileDto,
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
};

type ModalMode = "closed" | UserProfileModalMode;

function applyBootstrapResult(
  res: Awaited<ReturnType<typeof getUserProfileAction>>,
  auth0User: Auth0UserProps,
  setLoadError: (e: string | null) => void,
  setProfile: (p: UserProfileDto | null) => void,
  setModalMode: Dispatch<SetStateAction<ModalMode>>,
  incompleteOnboardingDismissedThisMount: boolean,
) {
  if (!res.ok) {
    setLoadError(res.error);
    setProfile(null);
    setModalMode((m) => (m === "settings" ? m : "onboarding"));
    return;
  }
  setLoadError(null);
  setProfile(res.data);
  if (!needsUserProfileOnboarding(res.data, auth0User)) {
    clearSpaOnboardingDismissed();
  }
  setModalMode((m) => {
    if (m === "settings") return m;
    if (!needsUserProfileOnboarding(res.data, auth0User)) return "closed";
    if (incompleteOnboardingDismissedThisMount) return "closed";
    if (isSpaOnboardingDismissed()) return "closed";
    return "onboarding";
  });
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
  /** Increments each time the bootstrap effect runs (deps change); first run per document clears SPA dismiss. */
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
      applyBootstrapResult(
        res,
        auth0User,
        setLoadError,
        setProfile,
        setModalMode,
        incompleteOnboardingDismissedThisMount.current,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [auth0User.name, auth0User.given_name, auth0User.email]);

  const reloadProfile = useCallback(async () => {
    const res = await getUserProfileAction();
    applyBootstrapResult(
      res,
      auth0User,
      setLoadError,
      setProfile,
      setModalMode,
      incompleteOnboardingDismissedThisMount.current,
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
    let recordOnboardingPrompt = false;
    setModalMode((prev) => {
      if (prev !== "settings" && prev !== "onboarding") return prev;
      if (prev === "onboarding") {
        recordOnboardingPrompt = true;
        incompleteOnboardingDismissedThisMount.current = true;
        setSpaOnboardingDismissed();
      }
      return "closed";
    });
    if (recordOnboardingPrompt) {
      void recordOnboardingPromptAction().then((r) => {
        if (r.ok) {
          setProfile(r.data);
        }
      });
    }
  }, []);

  const handleSaved = useCallback(
    (dto: UserProfileDto) => {
      setProfile(dto);
      setLoadError(null);
      if (!needsUserProfileOnboarding(dto, auth0User)) {
        incompleteOnboardingDismissedThisMount.current = false;
        clearSpaOnboardingDismissed();
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
        onRetry={() => void reloadProfile()}
      />
    </UserProfileModalContext.Provider>
  );
}
