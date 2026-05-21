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
    title: "How are you unlocking?",
    description:
      "Choose whether you buy and claim this wave as the surfer, or buy unlock as a sponsor without claiming.",
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

export function buildUnlockWizardSteps(
  canBuyClaim: boolean,
  canSponsor: boolean,
): WaveUnlockWizardStepId[] {
  let steps: WaveUnlockWizardStepId[] = [...WAVE_UNLOCK_WIZARD_STEPS];
  if (!canBuyClaim || !canSponsor) {
    steps = steps.filter((id) => id !== "role");
  }
  return steps;
}

export function intentLabel(intent: WaveUnlockCartIntent): string {
  return intent === "buy_claim"
    ? "Surfer — buy and claim"
    : "Sponsor — buy unlock only";
}
