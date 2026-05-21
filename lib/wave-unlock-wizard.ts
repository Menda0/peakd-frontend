import type { WaveUnlockCartIntent } from "@/lib/wave-unlock-cart";

export type WaveUnlockWizardStepId = "role" | "details" | "session" | "summary";

export const WAVE_UNLOCK_WIZARD_STEPS: WaveUnlockWizardStepId[] = [
  "role",
  "details",
  "session",
  "summary",
];

export const WAVE_UNLOCK_STEP_META: Record<
  WaveUnlockWizardStepId,
  { title: string; description: string }
> = {
  role: {
    title: "Who is unlocking?",
    description:
      "Choose whether you are sponsoring this wave or buying it to claim for yourself.",
  },
  details: {
    title: "Price & partner",
    description:
      "Review partner details and your Peaks price, including the community contribution.",
  },
  session: {
    title: "More from this session",
    description:
      "Other waves from the same session you may want to unlock.",
  },
  summary: {
    title: "Checkout",
    description: "Confirm your unlock and complete the purchase or add to cart.",
  },
};

export function buildUnlockWizardSteps(): WaveUnlockWizardStepId[] {
  return [...WAVE_UNLOCK_WIZARD_STEPS];
}

export function intentLabel(intent: WaveUnlockCartIntent): string {
  return intent === "buy_claim" ? "Claim video" : "Sponsor";
}
