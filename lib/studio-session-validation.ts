import { normalizeCommercialSettings } from "@/lib/commercial-settings";
import type { CommercialSettings } from "@/lib/commercial-settings";
import type { StudioSessionFormValues } from "@/components/studio/studio-session-form-fields";
import type { StudioSessionMode } from "@/components/studio/studio-session-mode-choice";

export function validateWizardTypeStep(
  sessionMode: StudioSessionMode | null,
  showTypeStep: boolean,
): string | null {
  if (!showTypeStep) return null;
  if (!sessionMode) return "Select Free Surf or Commercial.";
  return null;
}

export function validateWizardRegionDateStep(
  values: StudioSessionFormValues,
): string | null {
  if (!values.countryCode || !values.regionId || !values.spotId || !values.sessionDate) {
    return "Country, region, spot, and date are required.";
  }
  if (!values.sessionTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.sessionTime)) {
    return "Session start must be HH:mm (24-hour).";
  }
  if (
    !Number.isInteger(values.durationMinutes) ||
    values.durationMinutes < 15 ||
    values.durationMinutes > 1440
  ) {
    return "Duration must be between 15 and 1440 minutes.";
  }
  return null;
}

export function validateWizardCommercialStep(
  values: StudioSessionFormValues,
  partnerCommercialDefaults: CommercialSettings | null,
): string | null {
  if (!values.isCommercial) return null;
  if (!values.customizeCommercialPricing) {
    if (!partnerCommercialDefaults) {
      return "Set commercial pricing on your partner profile first, or customize below.";
    }
    return null;
  }
  if (!normalizeCommercialSettings(values.commercialSettings)) {
    return "Complete commercial pricing fields.";
  }
  return null;
}
