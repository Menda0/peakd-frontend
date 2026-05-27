import { getApiBase } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-error";
import { normalizeCurrency } from "@/lib/currencies";
import type { WaveUnlockCartIntent } from "@/lib/wave-unlock-cart";

export type UnlockCartQuoteLine = {
  jobId: string;
  intent: WaveUnlockCartIntent;
  videoName: string;
  sessionId: string;
  sessionLabel: string;
  thumbnailUrl: string | null;
  /** Uppercase ISO 4217 currency of the line's partner. */
  currency: string;
  listPriceMinor: number;
  discountPercent: number;
  discountSavedMinor: number;
  basePriceMinor: number;
  commissionMinor: number;
  totalMinor: number;
  commissionPercent: number;
};

export type UnlockCartQuoteGroup = {
  partnerUserId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  currency: string;
  lines: UnlockCartQuoteLine[];
  partnerSubtotalMinor: number;
  platformCommissionMinor: number;
  totalAmountMinor: number;
};

export type UnlockCartQuote = {
  groups: UnlockCartQuoteGroup[];
};

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.round(v)
    : fallback;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseLine(
  raw: unknown,
  fallbackCurrency: string,
): UnlockCartQuoteLine | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.jobId !== "string") return null;
  const intent: WaveUnlockCartIntent =
    r.intent === "sponsor" ? "sponsor" : "buy_claim";
  return {
    jobId: r.jobId,
    intent,
    videoName: str(r.videoName) || "Video",
    sessionId: str(r.sessionId),
    sessionLabel: str(r.sessionLabel) || "Session",
    thumbnailUrl: typeof r.thumbnailUrl === "string" ? r.thumbnailUrl : null,
    currency: (str(r.currency) || fallbackCurrency).toUpperCase(),
    listPriceMinor: num(r.listPriceMinor),
    discountPercent: num(r.discountPercent),
    discountSavedMinor: num(r.discountSavedMinor),
    basePriceMinor: num(r.basePriceMinor),
    commissionMinor: num(r.commissionMinor),
    totalMinor: num(r.totalMinor),
    commissionPercent: num(r.commissionPercent, 20),
  };
}

function parseGroup(raw: unknown): UnlockCartQuoteGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const currency = (str(r.currency) || "EUR").toUpperCase();
  const lines = Array.isArray(r.lines)
    ? r.lines
        .map((l) => parseLine(l, currency))
        .filter((l): l is UnlockCartQuoteLine => l !== null)
    : [];
  return {
    partnerUserId: str(r.partnerUserId),
    partnerName: str(r.partnerName) || "Partner",
    partnerAvatarUrl:
      typeof r.partnerAvatarUrl === "string" ? r.partnerAvatarUrl : null,
    currency,
    lines,
    partnerSubtotalMinor: num(r.partnerSubtotalMinor),
    platformCommissionMinor: num(r.platformCommissionMinor),
    totalAmountMinor: num(r.totalAmountMinor),
  };
}

export async function fetchUnlockCartQuote(
  items: { jobId: string; intent: WaveUnlockCartIntent }[],
): Promise<UnlockCartQuote> {
  if (items.length === 0) {
    return { groups: [] };
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
  const groups: UnlockCartQuoteGroup[] = [];
  if (Array.isArray(o.groups)) {
    for (const g of o.groups) {
      const parsed = parseGroup(g);
      if (parsed) groups.push(parsed);
    }
  }
  return { groups };
}

export type CartCheckoutGroupPayload = {
  partnerUserId: string;
  intent: WaveUnlockCartIntent;
  jobIds: string[];
};

/**
 * Kick off Stripe Checkout for a single partner group from the cart. Backend
 * groups items by partner so each call returns one redirect URL targeting
 * the partner's currency.
 */
export async function startCartGroupCheckout(
  payload: CartCheckoutGroupPayload,
): Promise<{ url: string; orderId: string }> {
  const res = await fetch(`${getApiBase()}/discover/cart/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Could not start cart checkout"),
    );
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = typeof o.url === "string" ? o.url : "";
  const orderId = typeof o.orderId === "string" ? o.orderId : "";
  if (!url || !orderId) {
    throw new Error("Cart checkout did not return a URL");
  }
  return { url, orderId };
}

/** Single-wave Buy-now: opens a Stripe Checkout for one job. */
export async function startSingleWaveCheckout(payload: {
  jobId: string;
  intent: WaveUnlockCartIntent;
}): Promise<{ url: string; orderId: string }> {
  const res = await fetch(
    `${getApiBase()}/discover/videos/${encodeURIComponent(payload.jobId)}/checkout`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: payload.intent }),
    },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Could not start checkout"),
    );
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = typeof o.url === "string" ? o.url : "";
  const orderId = typeof o.orderId === "string" ? o.orderId : "";
  if (!url || !orderId) {
    throw new Error("Checkout did not return a URL");
  }
  return { url, orderId };
}

export type WaveOrderStatusDto = {
  orderId: string;
  status: "pending" | "completed" | "failed";
  intent: WaveUnlockCartIntent;
  partnerUserId: string;
  jobIds: string[];
  currency: string;
  partnerSubtotalMinor: number;
  platformCommissionMinor: number;
  totalAmountMinor: number;
  failureReason: string | null;
  completedAt: string | null;
};

export async function fetchWaveOrderStatus(
  orderId: string,
): Promise<WaveOrderStatusDto> {
  const res = await fetch(
    `${getApiBase()}/orders/${encodeURIComponent(orderId)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Could not load order status"),
    );
  }
  const raw = await res.json();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const status =
    o.status === "completed"
      ? "completed"
      : o.status === "failed"
        ? "failed"
        : "pending";
  const intent: WaveUnlockCartIntent =
    o.intent === "sponsor" ? "sponsor" : "buy_claim";
  return {
    orderId: str(o.orderId) || orderId,
    status,
    intent,
    partnerUserId: str(o.partnerUserId),
    jobIds: Array.isArray(o.jobIds)
      ? o.jobIds.filter((id): id is string => typeof id === "string")
      : [],
    currency:
      typeof o.currency === "string" && o.currency.trim()
        ? normalizeCurrency(o.currency)
        : "EUR",
    partnerSubtotalMinor: num(o.partnerSubtotalMinor),
    platformCommissionMinor: num(o.platformCommissionMinor),
    totalAmountMinor: num(o.totalAmountMinor),
    failureReason:
      typeof o.failureReason === "string" ? o.failureReason : null,
    completedAt: typeof o.completedAt === "string" ? o.completedAt : null,
  };
}
