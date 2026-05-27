import { getApiBase } from "@/lib/api";

export type WalletPack = {
  id: string;
  label: string;
  peaks: number;
  baseAmountCents: number;
  platformFeeCents: number;
  totalAmountCents: number;
};

export type WalletResponse = {
  peaksBalance: number;
  peaksPerEuro: number;
  platformFeePercent: number;
  packs: WalletPack[];
};

export const PEAKS_BALANCE_REFRESH_EVENT = "peakd:peaks-balance-refresh";

export function formatPeaksCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function normalizeWallet(raw: unknown): WalletResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.packs)) return null;
  const peaksPerEuro = Number(o.peaksPerEuro);
  const platformFeePercent = Number(o.platformFeePercent);
  const peaksBalance = Number(o.peaksBalance);
  if (!Number.isFinite(peaksPerEuro) || !Number.isFinite(platformFeePercent)) {
    return null;
  }
  const packs: WalletPack[] = [];
  for (const item of o.packs) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    packs.push({
      id: String(p.id ?? ""),
      label: String(p.label ?? ""),
      peaks: Number(p.peaks),
      baseAmountCents: Number(p.baseAmountCents),
      platformFeeCents: Number(p.platformFeeCents),
      totalAmountCents: Number(p.totalAmountCents),
    });
  }
  return {
    peaksBalance: Number.isFinite(peaksBalance) ? Math.max(0, peaksBalance) : 0,
    peaksPerEuro,
    platformFeePercent,
    packs,
  };
}

export async function fetchWallet(): Promise<WalletResponse> {
  const res = await fetch(`${getApiBase()}/billing/wallet`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to load wallet (${res.status})`);
  }
  const data = normalizeWallet(await res.json());
  if (!data) {
    throw new Error("Invalid wallet response");
  }
  return data;
}

export async function startCheckout(packId: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ packId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Checkout failed (${res.status})`);
  }
  const body = (await res.json()) as { url?: string };
  if (!body.url) {
    throw new Error("Checkout did not return a URL");
  }
  return body.url;
}
