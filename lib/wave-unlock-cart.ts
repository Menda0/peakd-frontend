"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchUnlockCartQuote,
  type UnlockCartQuote,
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

export type WaveUnlockCartLine = WaveUnlockCartItem & UnlockCartQuoteLine;

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

export function cartQuoteTotalPeaks(quote: UnlockCartQuote | null): number {
  return quote?.totalPeaks ?? 0;
}

export function mergeCartWithQuote(
  items: WaveUnlockCartItem[],
  quote: UnlockCartQuote | null,
): WaveUnlockCartLine[] {
  if (!quote) {
    return items.map((item) => ({
      ...item,
      listPricePeaks: 0,
      discountPercent: 0,
      discountPeaksSaved: 0,
      basePeaks: 0,
      communityFeePeaks: 0,
      totalPeaks: 0,
      communityFeePercent: 20,
    }));
  }
  const byJob = new Map(quote.lines.map((line) => [line.jobId, line]));
  return items.map((item) => {
    const priced = byJob.get(item.jobId);
    if (!priced) {
      return {
        ...item,
        listPricePeaks: 0,
        discountPercent: 0,
        discountPeaksSaved: 0,
        basePeaks: 0,
        communityFeePeaks: 0,
        totalPeaks: 0,
        communityFeePercent: 20,
      };
    }
    return { ...item, ...priced };
  });
}

export function useWaveUnlockCart(): {
  items: WaveUnlockCartItem[];
  lines: WaveUnlockCartLine[];
  quote: UnlockCartQuote | null;
  count: number;
  totalPeaks: number;
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
    return () => window.removeEventListener(WAVE_UNLOCK_CART_UPDATED_EVENT, onUpdate);
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

  const lines = mergeCartWithQuote(items, quote);

  return {
    items,
    lines,
    quote,
    count: items.length,
    totalPeaks: cartQuoteTotalPeaks(quote),
    quoteLoading,
    refresh,
  };
}
