"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { UserProfileModal, type UserProfileModalMode } from "@/components/user-profile/user-profile-modal";
import { getUserProfileAction } from "@/lib/user-profile-actions";
import {
  needsUserProfileOnboarding,
  type UserProfileDto,
} from "@/lib/user-profile";

export type UserProfileModalApi = {
  openProfileSettings: () => void;
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
) {
  if (!res.ok) {
    setLoadError(res.error);
    setProfile(null);
    setModalMode((m) => (m === "settings" ? m : "onboarding"));
    return;
  }
  setLoadError(null);
  setProfile(res.data);
  setModalMode((m) => {
    if (m === "settings") return m;
    return needsUserProfileOnboarding(res.data, auth0User) ? "onboarding" : "closed";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getUserProfileAction();
      if (cancelled) return;
      applyBootstrapResult(res, auth0User, setLoadError, setProfile, setModalMode);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth0User.name, auth0User.given_name, auth0User.email]);

  useEffect(() => {
    if (modalMode !== "closed" || !profile) return;
    if (needsUserProfileOnboarding(profile, auth0User)) {
      setModalMode("onboarding");
    }
  }, [modalMode, profile, auth0User]);

  const reloadProfile = useCallback(async () => {
    const res = await getUserProfileAction();
    applyBootstrapResult(res, auth0User, setLoadError, setProfile, setModalMode);
  }, [auth0User]);

  const openProfileSettings = useCallback(async () => {
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
  }, []);

  const ctx = useMemo<UserProfileModalApi>(
    () => ({
      openProfileSettings,
    }),
    [openProfileSettings],
  );

  const handleCloseSettings = useCallback(() => {
    setModalMode((m) => (m === "settings" ? "closed" : m));
  }, []);

  const handleSaved = useCallback(
    (dto: UserProfileDto) => {
      setProfile(dto);
      setLoadError(null);
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
        onClose={handleCloseSettings}
        onSaved={handleSaved}
        onRetry={() => void reloadProfile()}
      />
    </UserProfileModalContext.Provider>
  );
}
