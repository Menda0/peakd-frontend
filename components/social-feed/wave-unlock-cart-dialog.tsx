"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BuyPeaksDialog } from "@/components/peaks/buy-peaks-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buyClaimWave, fetchPeaksBalance, sponsorWave } from "@/lib/commercial-wave";
import { dispatchWaveClaimedEvent } from "@/lib/claim-wave";
import {
  fetchWallet,
  PEAKS_BALANCE_REFRESH_EVENT,
  type WalletResponse,
} from "@/lib/billing";
import { intentLabel } from "@/lib/wave-unlock-wizard";
import {
  clearWaveUnlockCart,
  readWaveUnlockCart,
  removeFromWaveUnlockCart,
  useWaveUnlockCart,
  type WaveUnlockCartItem,
} from "@/lib/wave-unlock-cart";

export function WaveUnlockCartDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { items, totalPeaks, refresh } = useWaveUnlockCart();
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [buyPeaksOpen, setBuyPeaksOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const refreshWallet = async () => {
    try {
      setWallet(await fetchWallet());
    } catch {
      setWallet(null);
    }
  };

  const close = () => onOpenChange(false);

  const checkoutItem = async (item: WaveUnlockCartItem) => {
    if (item.intent === "buy_claim") {
      await buyClaimWave(item.jobId, item.quantity);
      dispatchWaveClaimedEvent();
    } else {
      await sponsorWave(item.jobId);
    }
    removeFromWaveUnlockCart(item.jobId);
  };

  const runCheckoutAll = async () => {
    const cart = readWaveUnlockCart();
    if (cart.length === 0) return;

    const balance = wallet?.peaksBalance ?? (await fetchPeaksBalance().catch(() => 0));
    const total = cart.reduce((s, i) => s + i.totalPeaks, 0);
    if (balance < total) {
      setPendingCheckout(true);
      setBuyPeaksOpen(true);
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    try {
      for (const item of cart) {
        try {
          await checkoutItem(item);
          successCount += 1;
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : `Failed to unlock ${item.label}`,
          );
          break;
        }
      }
      refresh();
      window.dispatchEvent(new CustomEvent(PEAKS_BALANCE_REFRESH_EVENT));
      void refreshWallet();
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Video unlocked"
            : `${successCount} videos unlocked`,
        );
      }
      if (readWaveUnlockCart().length === 0) {
        close();
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) void refreshWallet();
  }, [open]);

  const retryAfterTopUp = async () => {
    if (!pendingCheckout) return;
    const cart = readWaveUnlockCart();
    const total = cart.reduce((s, i) => s + i.totalPeaks, 0);
    const balance = await fetchPeaksBalance();
    if (balance < total) return;
    setPendingCheckout(false);
    void runCheckoutAll();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          className="flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0a1218] py-0 text-zinc-100 ring-white/10"
        >
          <CardHeader className="shrink-0 border-b border-white/10 px-6 pt-6 pb-4">
            <CardTitle id="cart-title">Unlock cart</CardTitle>
            <CardDescription className="text-zinc-500">
              Checkout waves you saved for later.
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">Your cart is empty.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.jobId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {intentLabel(item.intent)} · {item.totalPeaks} Peaks
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                      aria-label="Remove from cart"
                      onClick={() => {
                        removeFromWaveUnlockCart(item.jobId);
                        refresh();
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-white/10 bg-[#0a1218] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-200 sm:flex-1">
              Total: <span className="text-zinc-50">{totalPeaks} Peaks</span>
            </p>
            <div className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-transparent text-zinc-200"
                disabled={submitting || items.length === 0}
                onClick={() => {
                  clearWaveUnlockCart();
                  refresh();
                  toast.success("Cart cleared");
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={submitting || items.length === 0}
                onClick={() => {
                  void refreshWallet();
                  void runCheckoutAll();
                }}
              >
                {submitting ? "Processing…" : "Checkout"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <BuyPeaksDialog
        open={buyPeaksOpen}
        onOpenChange={(o) => {
          setBuyPeaksOpen(o);
          if (!o && pendingCheckout) void retryAfterTopUp();
        }}
        wallet={wallet}
        onWalletRefresh={refreshWallet}
      />
    </>
  );
}
