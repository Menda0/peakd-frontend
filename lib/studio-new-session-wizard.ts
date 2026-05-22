import type { CommercialSettings } from "@/lib/commercial-settings";
import type { StudioSessionFormValues } from "@/components/studio/studio-session-form-fields";
import type { StudioSessionMode } from "@/components/studio/studio-session-mode-choice";
import {
  validateWizardCommercialStep,
  validateWizardRegionDateStep,
  validateWizardTypeStep,
} from "@/lib/studio-session-validation";

export type NewSessionWizardStepId =
  | "type"
  | "region-date"
  | "conditions"
  | "commercial"
  | "summary";

export const WIZARD_STEP_META: Record<
  NewSessionWizardStepId,
  { title: string; description: string }
> = {
  type: {
    title: "Session type",
    description:
      "Choose how this session will appear on Discover and whether surfers pay Peaks.",
  },
  "region-date": {
    title: "Region & date",
    description:
      "Where and when you surfed. Use Undisclosed if you prefer not to share the exact region or spot.",
  },
  conditions: {
    title: "Conditions",
    description: "Optional overall rating and wave types for this session.",
  },
  commercial: {
    title: "Commercial pricing",
    description:
      "Use your partner defaults or set custom Peaks pricing for this session.",
  },
  summary: {
    title: "Summary",
    description: "Review your session details before creating.",
  },
};

export function buildNewSessionWizardSteps(
  showTypeStep: boolean,
  isCommercial: boolean,
): NewSessionWizardStepId[] {
  const steps: NewSessionWizardStepId[] = [];
  if (showTypeStep) steps.push("type");
  steps.push("region-date", "conditions");
  if (isCommercial) steps.push("commercial");
  steps.push("summary");
  return steps;
}

export function validateWizardStep(
  stepId: NewSessionWizardStepId,
  values: StudioSessionFormValues,
  sessionMode: StudioSessionMode | null,
  showTypeStep: boolean,
  partnerCommercialDefaults: CommercialSettings | null,
): string | null {
  switch (stepId) {
    case "type":
      return validateWizardTypeStep(sessionMode, showTypeStep);
    case "region-date":
      return validateWizardRegionDateStep(values);
    case "conditions":
      return null;
    case "commercial":
      return validateWizardCommercialStep(values, partnerCommercialDefaults);
    case "summary":
      return (
        validateWizardRegionDateStep(values) ??
        validateWizardCommercialStep(values, partnerCommercialDefaults)
      );
    default:
      return null;
  }
}
