import { getApiBase } from "@/lib/api";
import { normalizeSurferProfile, type SurferProfile } from "@/lib/surfer-profile";

export type BuyClaimWaveResult = {
  surfer: SurferProfile;
  peaksCharged: number;
  discountPercent: number;
};

export async function buyClaimWave(
  jobId: string,
  quantity = 1,
): Promise<BuyClaimWaveResult> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/discover/videos/${encodeURIComponent(jobId)}/buy-claim`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
  );
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const surfer = normalizeSurferProfile(o.surfer);
  if (!surfer) {
    throw new Error("Invalid buy-claim response");
  }
  return {
    surfer,
    peaksCharged: typeof o.peaksCharged === "number" ? o.peaksCharged : 0,
    discountPercent: typeof o.discountPercent === "number" ? o.discountPercent : 0,
  };
}

export async function sponsorWave(jobId: string): Promise<{
  peaksCharged: number;
  beneficiaryUserId: string;
}> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/discover/videos/${encodeURIComponent(jobId)}/sponsor`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    peaksCharged: typeof o.peaksCharged === "number" ? o.peaksCharged : 0,
    beneficiaryUserId:
      typeof o.beneficiaryUserId === "string" ? o.beneficiaryUserId : "",
  };
}

export async function fetchPeaksBalance(): Promise<number> {
  const base = getApiBase();
  const res = await fetch(`${base}/billing/wallet`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const balance = Number(o.peaksBalance);
  return Number.isFinite(balance) ? Math.max(0, balance) : 0;
}
