"use client";

import { useCallback, useEffect, useState } from "react";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";
import { BuyPeaksDialog } from "@/components/peaks/buy-peaks-dialog";
import { Button } from "@/components/ui/button";
import {
  buyClaimWave,
  fetchPeaksBalance,
  sponsorWave,
} from "@/lib/commercial-wave";
import {
  dispatchWaveClaimedEvent,
} from "@/lib/claim-wave";
import {
  fetchWallet,
  PEAKS_BALANCE_REFRESH_EVENT,
  type WalletResponse,
} from "@/lib/billing";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";
import { ClaimWaveButton } from "./claim-wave-button";

export function CommercialWaveActions({
  post,
  onClaimed,
  onPurchased,
  className,
}: {
  post: DiscoverFeedPost;
  onClaimed: (surfer: SurferProfile) => void;
  onPurchased: () => void;
  className?: string;
}) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [buyPeaksOpen, setBuyPeaksOpen] = useState(false);
  const [buyClaimOpen, setBuyClaimOpen] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"buy_claim" | "sponsor" | null>(
    null,
  );

  const refreshWallet = useCallback(async () => {
    try {
      setWallet(await fetchWallet());
    } catch {
      setWallet(null);
    }
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const price = post.buyClaimPricePeaks ?? post.wavePricePeaks ?? 0;
  const sponsorPrice = post.sponsorPricePeaks ?? post.wavePricePeaks ?? 0;
  const surferName = post.surfer?.displayName?.trim() || "this surfer";

  const runWithBalance = async (
    cost: number,
    action: "buy_claim" | "sponsor",
    run: () => Promise<void>,
  ) => {
    setError(null);
    const balance = wallet?.peaksBalance ?? (await fetchPeaksBalance().catch(() => 0));
    if (balance < cost) {
      setPendingAction(action);
      setBuyPeaksOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      await run();
      window.dispatchEvent(new CustomEvent(PEAKS_BALANCE_REFRESH_EVENT));
      void refreshWallet();
      onPurchased();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyClaimConfirm = async () => {
    await runWithBalance(price, "buy_claim", async () => {
      const { surfer } = await buyClaimWave(post.id, 1);
      dispatchWaveClaimedEvent();
      setBuyClaimOpen(false);
      onClaimed(surfer);
    });
  };

  const handleSponsorConfirm = async () => {
    await runWithBalance(sponsorPrice, "sponsor", async () => {
      await sponsorWave(post.id);
      setSponsorOpen(false);
    });
  };

  const retryPendingAfterTopUp = async () => {
    if (!pendingAction) return;
    const cost = pendingAction === "buy_claim" ? price : sponsorPrice;
    const balance = await fetchPeaksBalance();
    if (balance < cost) return;
    setPendingAction(null);
    if (pendingAction === "buy_claim") {
      setBuyClaimOpen(true);
    } else {
      setSponsorOpen(true);
    }
  };

  if (post.videoUnlockedByViewer) {
    return (
      <p className={cn("text-xs font-medium text-primary", className)}>
        Video unlocked — watch in My Videos
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2">
        {post.canClaim ? (
          <ClaimWaveButton
            jobId={post.id}
            partnerName={post.authorName}
            location={post.location}
            isOwnUpload={post.isOwnUpload}
            onClaimed={onClaimed}
          />
        ) : null}
        {post.canBuyClaim && price > 0 ? (
          <Button
            type="button"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setError(null);
              setBuyClaimOpen(true);
            }}
          >
            Buy &amp; claim · {price} Peaks
          </Button>
        ) : null}
        {post.canSponsor && sponsorPrice > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/15 bg-transparent text-zinc-200"
            onClick={() => {
              setError(null);
              setSponsorOpen(true);
            }}
          >
            Sponsor unlock · {sponsorPrice} Peaks
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <BuyPeaksDialog
        open={buyPeaksOpen}
        onOpenChange={(open) => {
          setBuyPeaksOpen(open);
          if (!open && pendingAction) {
            void retryPendingAfterTopUp();
          }
        }}
        wallet={wallet}
        onWalletRefresh={refreshWallet}
      />

      <GeoCreateConfirmModal
        open={buyClaimOpen}
        title="Buy and claim this wave?"
        description={
          <>
            Pay {price} Peaks to claim this wave from {post.authorName} at {post.location}{" "}
            and unlock the full video in My Videos. Any previous claimant will be replaced.
          </>
        }
        confirmLabel={submitting ? "Processing…" : `Pay ${price} Peaks`}
        cancelLabel="Cancel"
        onConfirm={() => void handleBuyClaimConfirm()}
        onCancel={() => setBuyClaimOpen(false)}
        isSubmitting={submitting}
        error={error}
      />

      <GeoCreateConfirmModal
        open={sponsorOpen}
        title="Sponsor video unlock?"
        description={
          <>
            Pay {sponsorPrice} Peaks to unlock the video for {surferName} at {post.location}.
            They keep claim on this wave.
          </>
        }
        confirmLabel={submitting ? "Processing…" : `Pay ${sponsorPrice} Peaks`}
        cancelLabel="Cancel"
        onConfirm={() => void handleSponsorConfirm()}
        onCancel={() => setSponsorOpen(false)}
        isSubmitting={submitting}
        error={error}
      />
    </div>
  );
}
