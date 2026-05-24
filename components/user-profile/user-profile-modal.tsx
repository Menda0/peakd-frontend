"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formInputLgClassName, formSelectClassName } from "@/lib/form-styles";
import { patchUserProfileAction, uploadUserAvatarAction } from "@/lib/user-profile-actions";
import {
  auth0DisplayNameHint,
  type SurfLevel,
  type UserProfileDto,
} from "@/lib/user-profile";
import { cn } from "@/lib/utils";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UserProfileModalMode = "onboarding" | "settings";

type Auth0Hints = {
  name?: string | null;
  given_name?: string | null;
  email?: string | null;
  picture?: string | null;
};

export function UserProfileModal({
  open,
  mode,
  profile,
  auth0User,
  loadError,
  onClose,
  onSaved,
  onProfileSnapshot,
  onRetry,
}: {
  open: boolean;
  mode: UserProfileModalMode;
  profile: UserProfileDto | null;
  auth0User: Auth0Hints;
  loadError: string | null;
  onClose: () => void;
  onSaved: (dto: UserProfileDto) => void;
  /** Called after avatar upload so parent state updates without closing the modal. */
  onProfileSnapshot: (dto: UserProfileDto) => void;
  onRetry?: () => void | Promise<void>;
}) {
  const allowDismiss = true;

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [surfLevel, setSurfLevel] = useState<SurfLevel | "">("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const seededFieldsForOpenCycleRef = useRef(false);

  useEffect(() => {
    if (!open) {
      seededFieldsForOpenCycleRef.current = false;
      return;
    }
    if (!profile) return;
    if (!seededFieldsForOpenCycleRef.current) {
      seededFieldsForOpenCycleRef.current = true;
      setDisplayName(
        profile.displayName?.trim() || auth0DisplayNameHint(auth0User) || "",
      );
      setNickname(profile.nickname?.trim() ?? "");
      setCountryCode(profile.countryCode?.trim() ? profile.countryCode : null);
      setRegionId(profile.homeRegionId?.trim() ? profile.homeRegionId : null);
      setSurfLevel(profile.surfLevel ?? "");
      setSubmitError(null);
    }
    setAvatarUrl(profile.avatarUrl ?? null);
  }, [open, profile, auth0User]);

  useEffect(() => {
    if (!open || !allowDismiss) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, allowDismiss, onClose]);

  const uploadAvatar = async (file: File) => {
    setAvatarError(null);
    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarError("Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const result = await uploadUserAvatarAction(fd);
      if (!result.ok) {
        throw new Error(result.error);
      }
      onProfileSnapshot(result.data);
      setAvatarUrl(result.data.avatarUrl);
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setAvatarBusy(false);
    }
  };

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
        toast.error(res.error);
        return;
      }
      onSaved(res.data);
      toast.success("Profile saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [countryCode, displayName, nickname, onSaved, regionId, surfLevel]);

  const displayPicture =
    avatarUrl?.trim() ||
    (typeof auth0User.picture === "string" && auth0User.picture.trim() !== ""
      ? auth0User.picture
      : null);

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
        if (allowDismiss && e.target === e.currentTarget && !saving && !avatarBusy) {
          onClose();
        }
      }}
    >
      <Card
        className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto border-border bg-popover text-foreground"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle id="user-profile-modal-title" className="text-lg text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
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
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : null}
          {profile || loadError ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-2 sm:w-40">
                  <div className="relative size-24 overflow-hidden rounded-full border border-border bg-muted">
                    {displayPicture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Auth0 / S3 URL
                      <img
                        src={displayPicture}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                  <Label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={saving || avatarBusy || !profile}
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (f) void uploadAvatar(f);
                      }}
                    />
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent",
                        (saving || avatarBusy || !profile) && "pointer-events-none opacity-50",
                      )}
                    >
                      {avatarBusy ? "Uploading…" : "Change photo"}
                    </span>
                  </Label>
                  {avatarError ? (
                    <p className="text-center text-xs text-red-400">{avatarError}</p>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-4">
              <FormField label="Name" htmlFor="user-profile-name">
                <Input
                  id="user-profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                  className={formInputLgClassName}
                  autoComplete="name"
                />
              </FormField>
              <FormField
                label={
                  <>
                    Nickname <span className="font-normal text-muted-foreground">(optional)</span>
                  </>
                }
                htmlFor="user-profile-nickname"
              >
                <Input
                  id="user-profile-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={saving}
                  className={formInputLgClassName}
                  placeholder="How you want to appear"
                />
              </FormField>
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
              <FormField
                label={
                  <>
                    Surf level <span className="font-normal text-muted-foreground">(optional)</span>
                  </>
                }
                htmlFor="user-profile-surf"
              >
                <Select
                  value={surfLevel || "none"}
                  onValueChange={(v) =>
                    setSurfLevel(v === "none" ? "" : (v as SurfLevel))
                  }
                  disabled={saving}
                >
                  <SelectTrigger id="user-profile-surf" className={formSelectClassName}>
                    <SelectValue placeholder="Prefer not to say" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Prefer not to say</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
        <CardFooter
          className={cn(
            "flex flex-wrap items-center gap-3 border-t border-border bg-popover px-4 py-4 text-foreground",
            allowDismiss || (loadError && onRetry) ? "justify-between" : "justify-end",
          )}
        >
          <div className="flex flex-wrap gap-2">
            {loadError && onRetry ? (
              <Button
                type="button"
                variant="outline"
                className="border-border bg-muted/50 text-foreground hover:bg-accent hover:text-foreground"
                disabled={saving || avatarBusy}
                onClick={() => void onRetry()}
              >
                Retry
              </Button>
            ) : null}
            {allowDismiss ? (
              <Button
                type="button"
                variant="outline"
                className="border-border bg-muted/50 text-foreground hover:bg-accent hover:text-foreground"
                disabled={saving || avatarBusy}
                onClick={onClose}
              >
                {mode === "onboarding" ? "Not now" : "Cancel"}
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            className="bg-[#26c2c9] text-primary-foreground hover:bg-[#22adb4]"
            disabled={saving || avatarBusy || !profile}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
