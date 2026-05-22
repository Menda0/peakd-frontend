"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BuyPeaksDialog } from "@/components/peaks/buy-peaks-dialog";
import { Button } from "@/components/ui/button";
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
    <li className="flex items-start gap-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
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
          <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
            Wave
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{line.videoName}</p>
        <p className="truncate text-xs text-muted-foreground">{line.sessionLabel}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{intentLabel(line.intent)}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">
            List: <span className="text-muted-foreground">{line.listPricePeaks} Peaks</span>
          </span>
          {line.discountPercent > 0 ? (
            <span className="text-emerald-400/90">
              {line.discountPercent}% off (−{line.discountPeaksSaved})
            </span>
          ) : null}
          <span className="font-medium text-foreground">{line.totalPeaks} Peaks</span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Remove from cart"
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

/** Cart list + checkout actions (used inside app-bar popover). */
export function WaveUnlockCartPanel({ onClose }: { onClose?: () => void }) {
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
  const totalCommunityFees = useMemo(
    () => lines.reduce((sum, line) => sum + line.communityFeePeaks, 0),
    [lines],
  );

  const refreshWallet = async () => {
    try {
      setWallet(await fetchWallet());
    } catch {
      setWallet(null);
    }
  };

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
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void refreshWallet();
  }, []);

  const retryAfterTopUp = async () => {
    if (!pendingCheckout) return;
    const balance = await fetchPeaksBalance();
    if (balance < totalPeaks) return;
    setPendingCheckout(false);
    void runCheckoutAll();
  };

  return (
    <>
      <div className="flex max-h-[min(70dvh,520px)] w-full flex-col">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Unlock cart</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Volume discounts apply per session when you claim multiple waves.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Your cart is empty.</p>
          ) : quoteLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Updating prices…</p>
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
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-4 py-3">
          {lines.length > 0 && !quoteLoading ? (
            <dl className="space-y-1 text-sm text-muted-foreground">
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
              <div className="flex justify-between text-muted-foreground">
                <dt>Total community fees</dt>
                <dd>{totalCommunityFees} Peaks</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <dt>Total in cart</dt>
                <dd>{totalPeaks} Peaks</dd>
              </div>
            </dl>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border bg-transparent text-foreground"
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
              size="sm"
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
        </div>
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
