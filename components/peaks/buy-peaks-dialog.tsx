"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeakIcon } from "@/components/peaks/peak-icon";
import {
  formatEur,
  formatPeaksCount,
  startCheckout,
  type WalletPack,
  type WalletResponse,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

function PackRow({
  pack,
  platformFeePercent,
  onBuy,
  buying,
  highlight,
}: {
  pack: WalletPack;
  platformFeePercent: number;
  onBuy: (packId: string) => void;
  buying: string | null;
  highlight?: boolean;
}) {
  const isBuying = buying === pack.id;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between",
        highlight && "border-[#26c2c9]/40 bg-[#26c2c9]/5",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <PeakIcon size={22} />
          <span className="text-base font-semibold text-zinc-50">
            {formatPeaksCount(pack.peaks)} peaks
          </span>
          <span className="text-sm text-zinc-500">· {pack.label}</span>
          {highlight ? (
            <span className="rounded-full bg-[#26c2c9]/15 px-2 py-0.5 text-xs font-medium text-[#26c2c9]">
              Best value
            </span>
          ) : null}
        </div>
        {platformFeePercent > 0 ? (
          <p className="text-xs text-zinc-500">
            {formatEur(pack.baseAmountCents)} + {platformFeePercent}% platform fee ={" "}
            <span className="text-zinc-300">{formatEur(pack.totalAmountCents)}</span>
          </p>
        ) : (
          <p className="text-xs text-zinc-500">{formatEur(pack.totalAmountCents)} total</p>
        )}
      </div>
      <Button
        type="button"
        className="shrink-0 bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
        disabled={Boolean(buying)}
        onClick={() => onBuy(pack.id)}
      >
        {isBuying ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Redirecting…
          </>
        ) : (
          <>Buy {formatEur(pack.totalAmountCents)}</>
        )}
      </Button>
    </div>
  );
}

export function BuyPeaksDialog({
  open,
  onOpenChange,
  wallet,
  onWalletRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: WalletResponse | null;
  onWalletRefresh: () => void;
}) {
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBuying(null);
      setError(null);
    }
  }, [open]);

  const handleBuy = useCallback(async (packId: string) => {
    setError(null);
    setBuying(packId);
    try {
      const url = await startCheckout(packId);
      window.location.href = url;
    } catch (e) {
      setBuying(null);
      setError(e instanceof Error ? e.message : "Checkout failed");
    }
  }, []);

  useEffect(() => {
    if (open) {
      onWalletRefresh();
    }
  }, [open, onWalletRefresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0a1218] text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Buy peaks</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {wallet
              ? `${formatPeaksCount(wallet.peaksPerEuro)} peaks = €1. Peaks are added to your balance after payment.`
              : "Choose a pack to top up your balance."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {wallet?.packs.map((pack) => (
            <PackRow
              key={pack.id}
              pack={pack}
              platformFeePercent={wallet.platformFeePercent}
              onBuy={handleBuy}
              buying={buying}
              highlight={pack.id === "ultimate"}
            />
          ))}
          {!wallet ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Loading packs…
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
