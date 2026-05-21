"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { buyClaimCartBatch } from "@/lib/commercial-cart";
import { sponsorWave, fetchPeaksBalance } from "@/lib/commercial-wave";
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
  type WaveUnlockCartLine,
} from "@/lib/wave-unlock-cart";

function CartLineRow({
  line,
  onRemove,
}: {
  line: WaveUnlockCartLine;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-zinc-900">
        {line.thumbnailUrl ? (
          <Image
            src={line.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] text-zinc-600">
            Wave
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{line.videoName}</p>
        <p className="truncate text-xs text-zinc-500">{line.sessionLabel}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{intentLabel(line.intent)}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="text-zinc-500">
            List: <span className="text-zinc-300">{line.listPricePeaks} Peaks</span>
          </span>
          {line.discountPercent > 0 ? (
            <span className="text-emerald-400/90">
              {line.discountPercent}% off (−{line.discountPeaksSaved})
            </span>
          ) : null}
          <span className="font-medium text-zinc-100">{line.totalPeaks} Peaks</span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        aria-label="Remove from cart"
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

export function WaveUnlockCartDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, totalPeaks, quoteLoading, refresh } = useWaveUnlockCart();
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [buyPeaksOpen, setBuyPeaksOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const listSubtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.listPricePeaks, 0),
    [lines],
  );
  const discountSaved = useMemo(
    () => lines.reduce((sum, line) => sum + line.discountPeaksSaved, 0),
    [lines],
  );

  const refreshWallet = async () => {
    try {
      setWallet(await fetchWallet());
    } catch {
      setWallet(null);
    }
  };

  const close = () => onOpenChange(false);

  const checkoutItem = async (line: WaveUnlockCartLine) => {
    if (line.intent === "buy_claim") {
      await buyClaimCartBatch([line.jobId]);
      dispatchWaveClaimedEvent();
    } else {
      await sponsorWave(line.jobId);
    }
    removeFromWaveUnlockCart(line.jobId);
  };

  const runCheckoutAll = async () => {
    const cart = readWaveUnlockCart();
    if (cart.length === 0 || lines.length === 0) return;

    const balance = wallet?.peaksBalance ?? (await fetchPeaksBalance().catch(() => 0));
    if (balance < totalPeaks) {
      setPendingCheckout(true);
      setBuyPeaksOpen(true);
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    try {
      const buyClaimBySession = new Map<string, string[]>();
      const sponsors: WaveUnlockCartLine[] = [];

      for (const line of lines) {
        if (line.intent === "sponsor") {
          sponsors.push(line);
          continue;
        }
        const bucket = buyClaimBySession.get(line.sessionId) ?? [];
        bucket.push(line.jobId);
        buyClaimBySession.set(line.sessionId, bucket);
      }

      for (const [, jobIds] of buyClaimBySession) {
        try {
          await buyClaimCartBatch(jobIds);
          for (const id of jobIds) {
            removeFromWaveUnlockCart(id);
            successCount += 1;
          }
          dispatchWaveClaimedEvent();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to unlock videos");
          break;
        }
      }

      for (const line of sponsors) {
        try {
          await checkoutItem(line);
          successCount += 1;
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : `Failed to unlock ${line.videoName}`,
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
    const total = totalPeaks;
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
          className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0a1218] py-0 text-zinc-100 ring-white/10"
        >
          <CardHeader className="shrink-0 border-b border-white/10 px-6 pt-6 pb-4">
            <CardTitle id="cart-title">Unlock cart</CardTitle>
            <CardDescription className="text-zinc-500">
              Volume discounts apply per session when you claim multiple waves.
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">Your cart is empty.</p>
            ) : quoteLoading ? (
              <p className="py-8 text-center text-sm text-zinc-500">Updating prices…</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((line) => (
                  <CartLineRow
                    key={line.jobId}
                    line={line}
                    onRemove={() => {
                      removeFromWaveUnlockCart(line.jobId);
                      refresh();
                    }}
                  />
                ))}
              </ul>
            )}
          </CardContent>

          <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-white/10 bg-[#0a1218] px-6 py-4">
            {lines.length > 0 && !quoteLoading ? (
              <dl className="space-y-1 text-sm text-zinc-400">
                <div className="flex justify-between">
                  <dt>List subtotal</dt>
                  <dd>{listSubtotal} Peaks</dd>
                </div>
                {discountSaved > 0 ? (
                  <div className="flex justify-between text-emerald-400/90">
                    <dt>Volume discounts</dt>
                    <dd>−{discountSaved} Peaks</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-zinc-50">
                  <dt>Total</dt>
                  <dd>{totalPeaks} Peaks</dd>
                </div>
              </dl>
            ) : null}
            <div className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-transparent text-zinc-200"
                disabled={submitting || lines.length === 0}
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
                disabled={submitting || lines.length === 0 || quoteLoading}
                onClick={() => {
                  void refreshWallet();
                  void runCheckoutAll();
                }}
              >
                {submitting ? "Processing…" : `Checkout · ${totalPeaks} Peaks`}
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
