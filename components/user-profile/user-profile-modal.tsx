"use client";

import { useCallback, useEffect, useState } from "react";
import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchUserProfileAction } from "@/lib/user-profile-actions";
import {
  auth0DisplayNameHint,
  type SurfLevel,
  type UserProfileDto,
} from "@/lib/user-profile";
import { cn } from "@/lib/utils";

export type UserProfileModalMode = "onboarding" | "settings";

type Auth0Hints = {
  name?: string | null;
  given_name?: string | null;
  email?: string | null;
};

export function UserProfileModal({
  open,
  mode,
  profile,
  auth0User,
  loadError,
  onClose,
  onSaved,
  onRetry,
}: {
  open: boolean;
  mode: UserProfileModalMode;
  profile: UserProfileDto | null;
  auth0User: Auth0Hints;
  loadError: string | null;
  onClose: () => void;
  onSaved: (dto: UserProfileDto) => void;
  onRetry?: () => void | Promise<void>;
}) {
  const allowDismiss = true;

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [surfLevel, setSurfLevel] = useState<SurfLevel | "">("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(
      profile.displayName?.trim() || auth0DisplayNameHint(auth0User) || "",
    );
    setNickname(profile.nickname?.trim() ?? "");
    setCountryCode(profile.countryCode?.trim() ? profile.countryCode : null);
    setRegionId(profile.homeRegionId?.trim() ? profile.homeRegionId : null);
    setSurfLevel(profile.surfLevel ?? "");
    setSubmitError(null);
  }, [open, profile, auth0User]);

  useEffect(() => {
    if (!open || !allowDismiss) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, allowDismiss, onClose]);

  const save = useCallback(async () => {
    setSubmitError(null);
    const dn = displayName.trim();
    if (!dn) {
      setSubmitError("Name is required.");
      return;
    }
    if (!countryCode?.trim()) {
      setSubmitError("Country is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await patchUserProfileAction({
        displayName: dn,
        nickname: nickname.trim() === "" ? null : nickname.trim(),
        countryCode,
        homeRegionId: regionId,
        surfLevel: surfLevel === "" ? null : surfLevel,
      });
      if (!res.ok) {
        setSubmitError(res.error);
        return;
      }
      onSaved(res.data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [countryCode, displayName, nickname, onSaved, regionId, surfLevel]);

  if (!open) {
    return null;
  }

  const title =
    mode === "onboarding" ? "Complete your profile" : "Edit your profile";
  const description =
    mode === "onboarding"
      ? "Add your name and country. You can skip for now; we will prompt again next time you open Peakd. Partner profile (if any) is separate."
      : "Update your app profile. Partner profile settings are unchanged.";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center p-4",
        mode === "onboarding" ? "bg-black/80" : "bg-black/70",
      )}
      role="presentation"
      onMouseDown={(e) => {
        if (allowDismiss && e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <Card
        className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto border-white/10 bg-[#0a1218] text-zinc-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle id="user-profile-modal-title" className="text-lg text-zinc-50">
            {title}
          </CardTitle>
          <CardDescription className="text-zinc-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError ? (
            <p className="text-sm text-red-400" role="alert">
              {loadError}
            </p>
          ) : null}
          {submitError ? (
            <p className="text-sm text-red-400" role="alert">
              {submitError}
            </p>
          ) : null}
          {!profile && !loadError ? (
            <p className="text-sm text-zinc-400">Loading profile…</p>
          ) : null}
          {profile || loadError ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="user-profile-name" className="text-zinc-300">
                  Name
                </Label>
                <Input
                  id="user-profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                  className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-profile-nickname" className="text-zinc-300">
                  Nickname <span className="font-normal text-zinc-500">(optional)</span>
                </Label>
                <Input
                  id="user-profile-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={saving}
                  className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
                  placeholder="How you want to appear"
                />
              </div>
              <CountryPicker
                id="user-profile-country"
                label="Country"
                countryCode={countryCode}
                onCountryCodeChange={(code) => {
                  setCountryCode(code);
                  setRegionId(null);
                }}
                disabled={saving}
                positionerClassName="z-[130]"
              />
              <RegionPicker
                id="user-profile-region"
                label="Local region (optional)"
                countryCode={countryCode}
                regionId={regionId}
                onRegionIdChange={setRegionId}
                disabled={saving}
                allowCreate={false}
                verifiedOnly
                positionerClassName="z-[130]"
              />
              <div className="space-y-2">
                <Label htmlFor="user-profile-surf" className="text-zinc-300">
                  Surf level <span className="font-normal text-zinc-500">(optional)</span>
                </Label>
                <select
                  id="user-profile-surf"
                  value={surfLevel}
                  onChange={(e) =>
                    setSurfLevel((e.target.value === "" ? "" : e.target.value) as SurfLevel | "")
                  }
                  disabled={saving}
                  className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-zinc-100 outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  <option value="">Prefer not to say</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </>
          ) : null}
        </CardContent>
        <CardFooter
          className={cn(
            "flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#0a1218] px-4 py-4 text-zinc-100",
            allowDismiss || (loadError && onRetry) ? "justify-between" : "justify-end",
          )}
        >
          <div className="flex flex-wrap gap-2">
            {loadError && onRetry ? (
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-zinc-50"
                disabled={saving}
                onClick={() => void onRetry()}
              >
                Retry
              </Button>
            ) : null}
            {allowDismiss ? (
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-zinc-50"
                disabled={saving}
                onClick={onClose}
              >
                {mode === "onboarding" ? "Not now" : "Cancel"}
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            className="bg-[#26c2c9] text-zinc-950 hover:bg-[#22adb4]"
            disabled={saving || !profile}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
