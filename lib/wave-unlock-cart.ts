"use client";

import { useCallback, useEffect, useState } from "react";

const CART_STORAGE_KEY = "peakd:wave-unlock-cart";
export const WAVE_UNLOCK_CART_UPDATED_EVENT = "peakd:wave-unlock-cart-updated";

export type WaveUnlockCartIntent = "buy_claim" | "sponsor";

export type WaveUnlockCartItem = {
  jobId: string;
  intent: WaveUnlockCartIntent;
  quantity: number;
  label: string;
  totalPeaks: number;
  addedAt: string;
};

export function readWaveUnlockCart(): WaveUnlockCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is WaveUnlockCartItem =>
        row != null &&
        typeof row === "object" &&
        typeof (row as WaveUnlockCartItem).jobId === "string" &&
        ((row as WaveUnlockCartItem).intent === "buy_claim" ||
          (row as WaveUnlockCartItem).intent === "sponsor"),
    );
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

export function clearWaveUnlockCart(): void {
  writeWaveUnlockCart([]);
}

export function cartTotalPeaks(items: WaveUnlockCartItem[]): number {
  return items.reduce((sum, i) => sum + i.totalPeaks, 0);
}

export function useWaveUnlockCart(): {
  items: WaveUnlockCartItem[];
  count: number;
  totalPeaks: number;
  refresh: () => void;
} {
  const [items, setItems] = useState<WaveUnlockCartItem[]>([]);

  const refresh = useCallback(() => {
    setItems(readWaveUnlockCart());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(WAVE_UNLOCK_CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(WAVE_UNLOCK_CART_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  return {
    items,
    count: items.length,
    totalPeaks: cartTotalPeaks(items),
    refresh,
  };
}
