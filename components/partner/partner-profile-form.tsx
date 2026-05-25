"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type PartnerProfileActionResult,
  getPartnerProfileAction,
  patchPartnerProfileAction,
  uploadPartnerAvatarAction,
} from "@/app/[userSub]/(social)/partner/profile/actions";
import type { PartnerProfileDto, PartnerType } from "@/lib/partner-profile";
import type { CommercialSettings } from "@/lib/commercial-settings";
import type { PartnerProfileFormValues } from "@/lib/partner-profile-schemas";
import { PartnerCommercialForm } from "./partner-commercial-form";
import { PartnerProfileDetailsForm } from "./partner-profile-details-form";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type PartnerTab = "profile" | "commercial";

const TAB_COPY: Record<
  PartnerTab,
  { title: string; description: string; objective: string }
> = {
  profile: {
    title: "Public profile",
    description:
      "Information shown on your posts, studio sessions, and anywhere surfers see you as the filmmaker.",
    objective:
      "Set how you present yourself on Peakd: display name, partner type, country, photo, and a short description. This builds trust with surfers who claim or buy your waves.",
  },
  commercial: {
    title: "Commercial pricing",
    description:
      "Default Peaks pricing when you mark a studio session as commercial.",
    objective:
      "Define how much surfers pay in Peaks to buy and unlock a wave, plus optional volume discounts for multi-wave purchases. These defaults apply to new commercial sessions unless you override them per session. Surfers can still claim a wave for free without unlocking the video; sponsors can pay to unlock for someone who already claimed.",
  },
};

function profileValuesFromDto(
  defaultPartnerName: string,
  dto: PartnerProfileDto,
): PartnerProfileFormValues {
  const name =
    dto.partnerName != null && dto.partnerName.trim() !== ""
      ? dto.partnerName
      : defaultPartnerName;
  return {
    partnerName: name,
    partnerType: dto.partnerType,
    descriptionMarkdown: dto.descriptionMarkdown ?? "",
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
  const [activeTab, setActiveTab] = useState<PartnerTab>("profile");
  const [loadError, setLoadError] = useState<string | null>(
    initialProfile.ok ? null : initialProfile.error,
  );
  const [reloadBusy, setReloadBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [commercialSaving, setCommercialSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const seed = initialProfile.ok ? initialProfile.data : null;
  const [dto, setDto] = useState<PartnerProfileDto | null>(seed);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(seed?.avatarUrl ?? null);

  const tabCopy = TAB_COPY[activeTab];
  const hasSavedCommercialSettings = dto?.commercialSettings != null;

  const applyDto = useCallback((next: PartnerProfileDto) => {
    setDto(next);
    setAvatarUrl(next.avatarUrl);
  }, []);

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
      setDto((prev) =>
        prev ? { ...prev, avatarUrl: result.data.avatarUrl } : result.data,
      );
      toast.success("Photo updated");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Avatar upload failed";
      setAvatarError(message);
      toast.error(message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveProfile = async (values: PartnerProfileFormValues) => {
    setProfileSaving(true);
    try {
      const r = await patchPartnerProfileAction({
        partnerName: values.partnerName.trim() || null,
        partnerType: values.partnerType as PartnerType,
        descriptionMarkdown: values.descriptionMarkdown.trim() || null,
        countryCode: values.countryCode,
      });
      if (!r.ok) {
        throw new Error(r.error);
      }
      applyDto(r.data);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveCommercial = async (settings: CommercialSettings) => {
    setCommercialSaving(true);
    try {
      const r = await patchPartnerProfileAction({
        commercialSettings: settings,
      });
      if (!r.ok) {
        throw new Error(r.error);
      }
      applyDto(r.data);
      toast.success("Commercial settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setCommercialSaving(false);
    }
  };

  if (loadError) {
    return (
      <Card className="border-border bg-white/[0.03] text-foreground ring-white/10">
        <CardHeader className="gap-1.5 border-b border-border pb-4">
          <CardTitle className="text-foreground">Partner settings</CardTitle>
          <CardDescription className="text-red-400/90">{loadError}</CardDescription>
        </CardHeader>
        <div className="border-t border-border p-4">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-muted/50 text-foreground hover:bg-accent hover:text-foreground"
            disabled={reloadBusy}
            onClick={() => void reload()}
          >
            {reloadBusy ? "Retrying…" : "Retry"}
          </Button>
        </div>
      </Card>
    );
  }

  if (!dto) {
    return null;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as PartnerTab)}
      className="w-full"
    >
      <TabsList className="mb-4 w-full sm:w-auto">
        <TabsTrigger value="profile" className="min-w-[7rem]">
          Profile
        </TabsTrigger>
        <TabsTrigger value="commercial" className="min-w-[7rem]">
          Commercial
        </TabsTrigger>
      </TabsList>

      <Card className="border-border bg-white/[0.03] text-foreground ring-white/10">
        <CardHeader className="gap-2 border-b border-border pb-4">
          <CardTitle className="text-foreground">{tabCopy.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{tabCopy.description}</CardDescription>
          <p className="text-sm leading-relaxed text-muted-foreground">{tabCopy.objective}</p>
        </CardHeader>
        <CardContent className="pt-6">
          <TabsContent value="profile" className="mt-0 outline-none">
            <PartnerProfileDetailsForm
              defaultPartnerName={defaultPartnerName}
              displayPicture={displayPicture}
              avatarBusy={avatarBusy}
              avatarError={avatarError}
              onAvatarUpload={(file) => void uploadAvatar(file)}
              initialValues={profileValuesFromDto(defaultPartnerName, dto)}
              saving={profileSaving}
              onSave={saveProfile}
            />
          </TabsContent>

          <TabsContent value="commercial" className="mt-0 outline-none">
            <PartnerCommercialForm
              savedSettings={dto.commercialSettings}
              showSuggestedDefaultsHint={!hasSavedCommercialSettings}
              saving={commercialSaving}
              onSave={saveCommercial}
            />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
