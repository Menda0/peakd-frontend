import { getApiBase } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-error";
import type { WaveUnlockCartIntent } from "@/lib/wave-unlock-cart";

export type UnlockCartQuoteLine = {
  jobId: string;
  intent: WaveUnlockCartIntent;
  videoName: string;
  sessionId: string;
  sessionLabel: string;
  thumbnailUrl: string | null;
  listPricePeaks: number;
  discountPercent: number;
  discountPeaksSaved: number;
  basePeaks: number;
  communityFeePeaks: number;
  totalPeaks: number;
  communityFeePercent: number;
};

export type UnlockCartQuote = {
  lines: UnlockCartQuoteLine[];
  totalPeaks: number;
};

export async function fetchUnlockCartQuote(
  items: { jobId: string; intent: WaveUnlockCartIntent }[],
): Promise<UnlockCartQuote> {
  if (items.length === 0) {
    return { lines: [], totalPeaks: 0 };
  }
  const res = await fetch(`${getApiBase()}/discover/cart/quote`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Could not price cart"));
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lines: UnlockCartQuoteLine[] = [];
  if (Array.isArray(o.lines)) {
    for (const row of o.lines) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.jobId !== "string") continue;
      const intent = r.intent === "sponsor" ? "sponsor" : "buy_claim";
      lines.push({
        jobId: r.jobId,
        intent,
        videoName: typeof r.videoName === "string" ? r.videoName : "Video",
        sessionId: typeof r.sessionId === "string" ? r.sessionId : "",
        sessionLabel:
          typeof r.sessionLabel === "string" ? r.sessionLabel : "Session",
        thumbnailUrl:
          typeof r.thumbnailUrl === "string" ? r.thumbnailUrl : null,
        listPricePeaks: Number(r.listPricePeaks) || 0,
        discountPercent: Number(r.discountPercent) || 0,
        discountPeaksSaved: Number(r.discountPeaksSaved) || 0,
        basePeaks: Number(r.basePeaks) || 0,
        communityFeePeaks: Number(r.communityFeePeaks) || 0,
        totalPeaks: Number(r.totalPeaks) || 0,
        communityFeePercent: Number(r.communityFeePercent) || 20,
      });
    }
  }
  return {
    lines,
    totalPeaks: typeof o.totalPeaks === "number" ? Math.round(o.totalPeaks) : 0,
  };
}

export async function buyClaimCartBatch(jobIds: string[]): Promise<{
  jobIds: string[];
  peaksCharged: number;
  discountPercent: number;
}> {
  const res = await fetch(`${getApiBase()}/discover/cart/buy-claim-batch`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobIds }),
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Batch unlock failed"));
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    jobIds: Array.isArray(o.jobIds)
      ? o.jobIds.filter((id): id is string => typeof id === "string")
      : jobIds,
    peaksCharged: typeof o.peaksCharged === "number" ? o.peaksCharged : 0,
    discountPercent: typeof o.discountPercent === "number" ? o.discountPercent : 0,
  };
}
