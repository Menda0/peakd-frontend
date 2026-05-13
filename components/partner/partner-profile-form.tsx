"use client";

import { useCallback, useId, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type PartnerProfileActionResult,
  getPartnerProfileAction,
  patchPartnerProfileAction,
  presignPartnerAvatarAction,
} from "@/app/[userSub]/(social)/partner/profile/actions";
import type { PartnerProfileDto, PartnerType } from "@/lib/partner-profile";
import { isPartnerType } from "@/lib/partner-profile";
import { cn } from "@/lib/utils";
import { PartnerCountryCombobox } from "./partner-country-combobox";
import { PartnerMarkdownField } from "./partner-markdown-field";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const TYPE_LABELS: Record<PartnerType, string> = {
  videographer: "Videographer",
  coach: "Coach",
  other: "Other",
};

function formStateFromDto(
  defaultPartnerName: string,
  dto: PartnerProfileDto,
): {
  partnerName: string;
  partnerType: PartnerType;
  descriptionMarkdown: string;
  avatarUrl: string | null;
  countryCode: string | null;
} {
  const name =
    dto.partnerName != null && dto.partnerName.trim() !== ""
      ? dto.partnerName
      : defaultPartnerName;
  return {
    partnerName: name,
    partnerType: dto.partnerType,
    descriptionMarkdown: dto.descriptionMarkdown ?? "",
    avatarUrl: dto.avatarUrl,
    countryCode: dto.countryCode,
  };
}

export function PartnerProfileForm({
  defaultPartnerName,
  fallbackUserPicture,
  initialProfile,
}: {
  defaultPartnerName: string;
  fallbackUserPicture?: string | null;
  initialProfile: PartnerProfileActionResult<PartnerProfileDto>;
}) {
  const idPrefix = useId();
  const nameId = `${idPrefix}-name`;
  const typeId = `${idPrefix}-type`;
  const countryId = `${idPrefix}-country`;

  const [loadError, setLoadError] = useState<string | null>(
    initialProfile.ok ? null : initialProfile.error,
  );
  const [reloadBusy, setReloadBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const seed = initialProfile.ok ? formStateFromDto(defaultPartnerName, initialProfile.data) : null;
  const [partnerName, setPartnerName] = useState(seed?.partnerName ?? "");
  const [partnerType, setPartnerType] = useState<PartnerType>(seed?.partnerType ?? "videographer");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(seed?.descriptionMarkdown ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(seed?.avatarUrl ?? null);
  const [countryCode, setCountryCode] = useState<string | null>(seed?.countryCode ?? null);

  const applyDto = useCallback(
    (dto: PartnerProfileDto) => {
      const next = formStateFromDto(defaultPartnerName, dto);
      setPartnerName(next.partnerName);
      setPartnerType(next.partnerType);
      setDescriptionMarkdown(next.descriptionMarkdown);
      setAvatarUrl(next.avatarUrl);
      setCountryCode(next.countryCode);
    },
    [defaultPartnerName],
  );

  const reload = useCallback(async () => {
    setLoadError(null);
    setReloadBusy(true);
    try {
      const r = await getPartnerProfileAction();
      if (r.ok) {
        applyDto(r.data);
      } else {
        setLoadError(r.error);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setReloadBusy(false);
    }
  }, [applyDto]);

  const displayPicture = avatarUrl ?? fallbackUserPicture ?? null;

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
      const presignResult = await presignPartnerAvatarAction({
        contentType: file.type || "application/octet-stream",
        filename: file.name,
      });
      if (!presignResult.ok) {
        throw new Error(presignResult.error);
      }
      const presign = presignResult.data;
      const method = (presign.method || "PUT").toUpperCase();
      const headers = new Headers(presign.headers ?? undefined);
      if (!headers.has("Content-Type") && file.type) {
        headers.set("Content-Type", file.type);
      }
      const putRes = await fetch(presign.uploadUrl, {
        method,
        headers,
        body: file,
        mode: "cors",
        credentials: "omit",
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }
      const patchResult = await patchPartnerProfileAction({ avatarKey: presign.avatarKey });
      if (!patchResult.ok) {
        throw new Error(patchResult.error);
      }
      setAvatarUrl(patchResult.data.avatarUrl);
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveProfile = async () => {
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const r = await patchPartnerProfileAction({
        partnerName: partnerName.trim() || null,
        partnerType,
        descriptionMarkdown: descriptionMarkdown.trim() || null,
        countryCode,
      });
      if (!r.ok) {
        throw new Error(r.error);
      }
      applyDto(r.data);
      setSaveOk(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <Card className="border-white/10 bg-white/[0.03] text-zinc-100 ring-white/10">
        <CardHeader className="gap-1.5 border-b border-white/10 pb-4">
          <CardTitle className="text-zinc-50">Partner profile</CardTitle>
          <CardDescription className="text-red-400/90">{loadError}</CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-white/10 bg-white/[0.03] p-4">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-zinc-50"
            disabled={reloadBusy}
            onClick={() => void reload()}
          >
            {reloadBusy ? "Retrying…" : "Retry"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03] text-zinc-100 ring-white/10">
      <CardHeader className="gap-1.5 border-b border-white/10 pb-4">
        <CardTitle className="text-zinc-50">Partner profile</CardTitle>
        <CardDescription className="text-zinc-400">
          Edit how you appear to the Peakd community. Changes are saved to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2 sm:w-40">
            <div className="relative size-28 overflow-hidden rounded-full border border-white/15 bg-zinc-800">
              {displayPicture ? (
                // eslint-disable-next-line @next/next/no-img-element -- external S3 / Auth0 URL
                <img
                  src={displayPicture}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-zinc-500">
                  No photo
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={avatarBusy}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (f) void uploadAvatar(f);
                }}
              />
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10",
                  avatarBusy && "pointer-events-none opacity-50",
                )}
              >
                {avatarBusy ? "Uploading…" : "Change photo"}
              </span>
            </label>
            {avatarError ? <p className="text-center text-xs text-red-400">{avatarError}</p> : null}
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <div>
              <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-zinc-300">
                Partner name
              </label>
              <Input
                id={nameId}
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder={defaultPartnerName}
                className="h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
              />
              <p className="mt-1 text-xs text-zinc-500">Leave blank to use your account name.</p>
            </div>

            <div>
              <label htmlFor={typeId} className="mb-1.5 block text-sm font-medium text-zinc-300">
                Type
              </label>
              <Select
                value={partnerType}
                items={TYPE_LABELS}
                onValueChange={(next) => {
                  if (next && isPartnerType(next)) {
                    setPartnerType(next);
                  }
                }}
              >
                <SelectTrigger
                  id={typeId}
                  className="h-10 w-full max-w-md border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 focus-visible:border-[#26c2c9]/60 focus-visible:ring-2 focus-visible:ring-[#26c2c9]/25 data-placeholder:text-zinc-500"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-w-md border border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10">
                  {(Object.keys(TYPE_LABELS) as PartnerType[]).map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="focus:bg-[#26c2c9]/15 focus:text-zinc-50 data-highlighted:bg-[#26c2c9]/15 data-highlighted:text-zinc-50"
                    >
                      {TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Description</span>
          <PartnerMarkdownField value={descriptionMarkdown} onChange={setDescriptionMarkdown} />
        </div>

        <PartnerCountryCombobox
          id={countryId}
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
        />
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-white/10 bg-white/[0.03] p-4 text-zinc-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm">
          {saveError ? <span className="text-red-400">{saveError}</span> : null}
          {saveOk && !saveError ? <span className="text-[#26c2c9]">Saved.</span> : null}
        </div>
        <Button
          type="button"
          className="bg-[#26c2c9] text-zinc-950 hover:bg-[#22adb4]"
          disabled={saving}
          onClick={() => void saveProfile()}
        >
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}
