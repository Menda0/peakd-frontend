"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  waveOverlayStackClassName,
  waveOverlayStackItemClassName,
} from "@/lib/wave-overlay-button";
import { ClaimWaveButton } from "./claim-wave-button";
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

  const price = post.buyClaimPricePeaks ?? post.wavePricePeaks ?? 0;
  const sponsorPrice = post.sponsorPricePeaks ?? post.wavePricePeaks ?? 0;
  const unlockFromPrice =
    post.canBuyClaim && price > 0
      ? price
      : post.canSponsor && sponsorPrice > 0
        ? sponsorPrice
        : null;
  const showUnlock =
    !post.videoUnlockedByViewer &&
    (post.canBuyClaim || post.canSponsor) &&
    unlockFromPrice != null &&
    unlockFromPrice > 0;

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
      className={
        overlay
          ? waveOverlayStackItemClassName
          : "mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
      }
      onClick={() => setWizardOpen(true)}
    >
      Unlock video
      {!overlay && unlockFromPrice > 0 ? ` · from ${unlockFromPrice} Peaks` : null}
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
    </>
  );
}
