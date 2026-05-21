import type { WaveUnlockCartIntent } from "@/lib/wave-unlock-cart";

export type WaveUnlockWizardStepId = "role" | "details" | "summary";

export const WAVE_UNLOCK_WIZARD_STEPS: WaveUnlockWizardStepId[] = [
  "role",
  "details",
  "summary",
];

export const WAVE_UNLOCK_STEP_META: Record<
  WaveUnlockWizardStepId,
  { title: string; description: string }
> = {
  role: {
    title: "How are you unlocking?",
    description:
      "Choose whether you are claiming this wave as the surfer or sponsoring unlock for someone else.",
  },
  details: {
    title: "Price & partner",
    description:
      "Review partner details, your Peaks price including the community contribution, and other waves from this session.",
  },
  summary: {
    title: "Checkout",
    description: "Confirm your unlock and complete the purchase or add to cart.",
  },
};

export function buildUnlockWizardSteps(
  canBuyClaim: boolean,
  canSponsor: boolean,
): WaveUnlockWizardStepId[] {
  if (canBuyClaim && canSponsor) {
    return [...WAVE_UNLOCK_WIZARD_STEPS];
  }
  return WAVE_UNLOCK_WIZARD_STEPS.filter((id) => id !== "role");
}

export function intentLabel(intent: WaveUnlockCartIntent): string {
  return intent === "buy_claim" ? "Surfer (claim wave)" : "Sponsor";
}
