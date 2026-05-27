"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchUnlockCartQuote,
  type UnlockCartQuote,
  type UnlockCartQuoteGroup,
  type UnlockCartQuoteLine,
} from "@/lib/commercial-cart";

const CART_STORAGE_KEY = "peakd:wave-unlock-cart";
export const WAVE_UNLOCK_CART_UPDATED_EVENT = "peakd:wave-unlock-cart-updated";

export type WaveUnlockCartIntent = "buy_claim" | "sponsor";

/** Stored in localStorage; pricing comes from cart quote API. */
export type WaveUnlockCartItem = {
  jobId: string;
  intent: WaveUnlockCartIntent;
  sessionId: string;
  sessionLabel: string;
  videoName: string;
  thumbnailUrl: string | null;
  addedAt: string;
};

export type WaveUnlockCartGroupedLine = WaveUnlockCartItem &
  UnlockCartQuoteLine;

export type WaveUnlockCartGroup = Omit<UnlockCartQuoteGroup, "lines"> & {
  lines: WaveUnlockCartGroupedLine[];
};

export function readWaveUnlockCart(): WaveUnlockCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is WaveUnlockCartItem => {
        if (!row || typeof row !== "object") return false;
        const o = row as WaveUnlockCartItem;
        return (
          typeof o.jobId === "string" &&
          (o.intent === "buy_claim" || o.intent === "sponsor") &&
          typeof o.sessionId === "string" &&
          typeof o.sessionLabel === "string" &&
          typeof o.videoName === "string"
        );
      })
      .map((row) => ({
        ...row,
        thumbnailUrl:
          typeof row.thumbnailUrl === "string" ? row.thumbnailUrl : null,
      }));
  } catch {
    return [];
  }
}

export function writeWaveUnlockCart(items: WaveUnlockCartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(WAVE_UNLOCK_CART_UPDATED_EVENT));
}

export function addToWaveUnlockCart(item: WaveUnlockCartItem): void {
  const items = readWaveUnlockCart().filter((i) => i.jobId !== item.jobId);
  items.push(item);
  writeWaveUnlockCart(items);
}

export function removeFromWaveUnlockCart(jobId: string): void {
  writeWaveUnlockCart(readWaveUnlockCart().filter((i) => i.jobId !== jobId));
}

export function isJobInWaveUnlockCart(jobId: string): boolean {
  return readWaveUnlockCart().some((i) => i.jobId === jobId);
}

export function clearWaveUnlockCart(): void {
  writeWaveUnlockCart([]);
}

/**
 * Merge stored items with the priced groups returned by `/discover/cart/quote`.
 * Items missing from the quote (e.g. just-added jobs the server hasn't priced
 * yet) are dropped — the UI shows "Updating prices…" while a fresh quote is
 * being fetched, so showing zero-priced rows is misleading.
 */
export function mergeCartWithQuote(
  items: WaveUnlockCartItem[],
  quote: UnlockCartQuote | null,
): WaveUnlockCartGroup[] {
  if (!quote) return [];
  const byJob = new Map(items.map((item) => [item.jobId, item]));
  const groups: WaveUnlockCartGroup[] = [];
  for (const group of quote.groups) {
    const lines: WaveUnlockCartGroupedLine[] = [];
    for (const line of group.lines) {
      const item = byJob.get(line.jobId);
      if (!item) continue;
      lines.push({ ...item, ...line });
    }
    if (lines.length === 0) continue;
    groups.push({ ...group, lines });
  }
  return groups;
}

export function useWaveUnlockCart(): {
  items: WaveUnlockCartItem[];
  groups: WaveUnlockCartGroup[];
  quote: UnlockCartQuote | null;
  count: number;
  quoteLoading: boolean;
  refresh: () => void;
} {
  const [items, setItems] = useState<WaveUnlockCartItem[]>([]);
  const [quote, setQuote] = useState<UnlockCartQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const refresh = useCallback(() => {
    setItems(readWaveUnlockCart());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(WAVE_UNLOCK_CART_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(WAVE_UNLOCK_CART_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    void fetchUnlockCartQuote(
      items.map((i) => ({ jobId: i.jobId, intent: i.intent })),
    )
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  const groups = mergeCartWithQuote(items, quote);

  return {
    items,
    groups,
    quote,
    count: items.length,
    quoteLoading,
    refresh,
  };
}
