"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currencies";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  removeFromWaveUnlockCart,
  useWaveUnlockCart,
} from "@/lib/wave-unlock-cart";
import {
  waveOverlayStackClassName,
  waveOverlayStackItemClassName,
} from "@/lib/wave-overlay-button";
import { cn } from "@/lib/utils";
import { ClaimWaveButton } from "./claim-wave-button";
import { RemoveFromCartDialog } from "./remove-from-cart-dialog";
import { WaveUnlockCheckoutWizard } from "./wave-unlock-checkout-wizard";

export function CommercialWaveActions({
  post,
  onClaimed,
  onPurchased,
  overlay = false,
}: {
  post: DiscoverFeedPost;
  onClaimed: (surfer: SurferProfile) => void;
  onPurchased: () => void;
  overlay?: boolean;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [removeCartOpen, setRemoveCartOpen] = useState(false);
  const { items: cartItems, refresh: refreshCart } = useWaveUnlockCart();

  const cartItem = useMemo(
    () => cartItems.find((item) => item.jobId === post.id),
    [cartItems, post.id],
  );
  const inCart = Boolean(cartItem);

  const price = post.buyClaimPriceMinor ?? post.wavePriceMinor ?? 0;
  const sponsorPrice = post.sponsorPriceMinor ?? post.wavePriceMinor ?? 0;
  const currency = post.currency ?? "EUR";
  const unlockFromPriceMinor =
    post.canBuyClaim && price > 0
      ? price
      : post.canSponsor && sponsorPrice > 0
        ? sponsorPrice
        : null;
  const showUnlock =
    !post.videoUnlockedByViewer &&
    (post.canBuyClaim || post.canSponsor) &&
    unlockFromPriceMinor != null &&
    unlockFromPriceMinor > 0;

  if (post.videoUnlockedByViewer) {
    if (overlay) return null;
    return (
      <p className="text-xs font-medium text-primary">
        Video unlocked — watch in My Videos
      </p>
    );
  }

  const unlockButton = showUnlock ? (
    <Button
      type="button"
      size="sm"
      className={cn(
        overlay
          ? waveOverlayStackItemClassName
          : "mt-3",
        inCart
          ? overlay
            ? "border border-white/15 bg-black/55 text-white hover:bg-black/65 backdrop-blur-sm"
            : "border border-border bg-muted/80 text-foreground hover:bg-muted"
          : overlay
            ? undefined
            : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
      onClick={() => {
        if (inCart) {
          setRemoveCartOpen(true);
        } else {
          setWizardOpen(true);
        }
      }}
    >
      {inCart ? "Added to cart" : "Unlock video"}
      {!inCart && !overlay && unlockFromPriceMinor != null && unlockFromPriceMinor > 0
        ? ` · from ${formatMoney(unlockFromPriceMinor, currency)}`
        : null}
    </Button>
  ) : null;

  const claimButton =
    post.canClaim && overlay ? (
      <ClaimWaveButton
        variant="overlay-stacked"
        jobId={post.id}
        partnerName={post.authorName}
        location={post.location}
        isOwnUpload={post.isOwnUpload}
        onClaimed={onClaimed}
      />
    ) : post.canClaim ? (
      <ClaimWaveButton
        jobId={post.id}
        partnerName={post.authorName}
        location={post.location}
        isOwnUpload={post.isOwnUpload}
        onClaimed={onClaimed}
      />
    ) : null;

  return (
    <>
      {overlay ? (
        <div className={waveOverlayStackClassName}>
          {unlockButton}
          {claimButton}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {claimButton}
          {unlockButton}
        </div>
      )}

      <WaveUnlockCheckoutWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        jobId={post.id}
        onPurchased={onPurchased}
        onClaimed={onClaimed}
      />

      <RemoveFromCartDialog
        open={removeCartOpen}
        onOpenChange={setRemoveCartOpen}
        videoName={cartItem?.videoName ?? post.sessionSummary}
        onConfirm={() => {
          removeFromWaveUnlockCart(post.id);
          refreshCart();
          toast.success("Removed from cart");
        }}
      />
    </>
  );
}
