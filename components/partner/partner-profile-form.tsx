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
import { FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formInputLgClassName } from "@/lib/form-styles";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  type PartnerProfileActionResult,
  getPartnerProfileAction,
  patchPartnerProfileAction,
  uploadPartnerAvatarAction,
} from "@/app/[userSub]/(social)/partner/profile/actions";
import type { PartnerProfileDto, PartnerType } from "@/lib/partner-profile";
import { isPartnerType } from "@/lib/partner-profile";
import { cn } from "@/lib/utils";
import { CommercialSettingsFields } from "@/components/commercial/commercial-settings-fields";
import {
  DEFAULT_COMMERCIAL_SETTINGS,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import { PartnerCountryCombobox } from "./partner-country-combobox";
import { PartnerMarkdownField } from "./partner-markdown-field";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const TYPE_LABELS: Record<PartnerType, string> = {
  videographer: "Videographer",
  coach: "Coach",
  other: "Other",
};

const TYPE_KEYS = Object.keys(TYPE_LABELS) as PartnerType[];

function formStateFromDto(
  defaultPartnerName: string,
  dto: PartnerProfileDto,
): {
  partnerName: string;
  partnerType: PartnerType;
  descriptionMarkdown: string;
  avatarUrl: string | null;
  countryCode: string | null;
  commercialSettings: CommercialSettings;
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
    commercialSettings: dto.commercialSettings ?? DEFAULT_COMMERCIAL_SETTINGS,
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
  const [commercialSettings, setCommercialSettings] = useState<CommercialSettings>(
    seed?.commercialSettings ?? DEFAULT_COMMERCIAL_SETTINGS,
  );

  const applyDto = useCallback(
    (dto: PartnerProfileDto) => {
      const next = formStateFromDto(defaultPartnerName, dto);
      setPartnerName(next.partnerName);
      setPartnerType(next.partnerType);
      setDescriptionMarkdown(next.descriptionMarkdown);
      setAvatarUrl(next.avatarUrl);
      setCountryCode(next.countryCode);
      setCommercialSettings(next.commercialSettings);
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
      const fd = new FormData();
      fd.append("file", file, file.name);
      const result = await uploadPartnerAvatarAction(fd);
      if (!result.ok) {
        throw new Error(result.error);
      }
      setAvatarUrl(result.data.avatarUrl);
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
        commercialSettings,
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
            <Label className="cursor-pointer">
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
            </Label>
            {avatarError ? <p className="text-center text-xs text-red-400">{avatarError}</p> : null}
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <FormField
              label="Partner name"
              htmlFor={nameId}
              description="Leave blank to use your account name."
            >
              <Input
                id={nameId}
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder={defaultPartnerName}
                className={formInputLgClassName}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField label="Type" htmlFor={typeId} className="min-w-0">
                <Combobox
                  items={TYPE_KEYS}
                  value={partnerType}
                  onValueChange={(next) => {
                    if (next != null && isPartnerType(next)) {
                      setPartnerType(next);
                    }
                  }}
                  itemToStringValue={(key) => TYPE_LABELS[key]}
                  autoHighlight
                >
                  <ComboboxInput
                    id={typeId}
                    placeholder="Search type…"
                    className={cn(
                      "h-10 w-full min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
                      "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
                    )}
                  />
                  <ComboboxContent
                    className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
                    align="start"
                  >
                    <ComboboxEmpty className="text-zinc-500">No matches.</ComboboxEmpty>
                    <ComboboxList>
                      {(key: PartnerType) => (
                        <ComboboxItem
                          key={key}
                          value={key}
                          className="text-zinc-200 data-highlighted:bg-primary/15 data-highlighted:text-zinc-50"
                        >
                          {TYPE_LABELS[key]}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormField>
              <div className="min-w-0">
                <PartnerCountryCombobox
                  id={countryId}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                />
              </div>
            </div>
          </div>
        </div>

        <FormField label="Description">
          <PartnerMarkdownField value={descriptionMarkdown} onChange={setDescriptionMarkdown} />
        </FormField>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Commercial</h3>
          <p className="mt-1 mb-4 text-xs text-zinc-500">
            Default pricing for commercial studio sessions. Surfers can claim waves for free or
            buy to unlock video playback.
          </p>
          <CommercialSettingsFields
            idPrefix={`${idPrefix}-commercial`}
            values={commercialSettings}
            onChange={setCommercialSettings}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-white/10 bg-white/[0.03] p-4 text-zinc-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm">
          {saveError ? <span className="text-red-400">{saveError}</span> : null}
          {saveOk && !saveError ? <span className="text-primary">Saved.</span> : null}
        </div>
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={saving}
          onClick={() => void saveProfile()}
        >
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}
