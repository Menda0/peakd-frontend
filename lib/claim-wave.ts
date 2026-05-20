import { getApiBase } from "@/lib/api";
import { normalizeSurferProfile, type SurferProfile } from "@/lib/surfer-profile";

export const WAVE_CLAIMED_EVENT = "peakd:wave-claimed";

export type ClaimWaveResult = {
  surfer: SurferProfile;
};

export async function claimWave(jobId: string): Promise<ClaimWaveResult> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/discover/videos/${encodeURIComponent(jobId)}/claim`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  const surfer = normalizeSurferProfile(
    raw && typeof raw === "object" ? (raw as Record<string, unknown>).surfer : null,
  );
  if (!surfer) {
    throw new Error("Invalid claim response");
  }
  return { surfer };
}

export function dispatchWaveClaimedEvent(): void {
  window.dispatchEvent(new CustomEvent(WAVE_CLAIMED_EVENT));
}
