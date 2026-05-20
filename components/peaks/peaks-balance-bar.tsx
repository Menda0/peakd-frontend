"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { BuyPeaksDialog } from "@/components/peaks/buy-peaks-dialog";
import { PeakIcon } from "@/components/peaks/peak-icon";
import {
  fetchWallet,
  formatPeaksCount,
  PEAKS_BALANCE_REFRESH_EVENT,
  type WalletResponse,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

export function PeaksBalanceBar() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWallet();
      setWallet(data);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(PEAKS_BALANCE_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(PEAKS_BALANCE_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  return (
    <>
      <BuyPeaksDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        wallet={wallet}
        onWalletRefresh={refresh}
      />
      <button
        type="button"
        onClick={() => setBuyOpen(true)}
        className={cn(
          "group flex max-w-[9.5rem] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1.5 pl-2 pr-2.5 text-left transition hover:border-[#26c2c9]/35 hover:bg-white/[0.07] sm:max-w-none sm:pl-2.5 sm:pr-3",
        )}
        aria-label="Peaks balance. Click to buy peaks."
      >
        <PeakIcon size={22} className="size-5 sm:size-[22px]" />
        <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-zinc-50">
          {loading ? (
            <Loader2Icon className="size-3.5 animate-spin text-zinc-400" aria-hidden />
          ) : (
            formatPeaksCount(wallet?.peaksBalance ?? 0)
          )}
          <PlusIcon
            className="size-3 shrink-0 text-[#26c2c9] opacity-80 group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </button>
    </>
  );
}
