"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { usePathname, useSearchParams } from "next/navigation";
import { ClaimWaveButton } from "@/components/social-feed/claim-wave-button";
import { Button } from "@/components/ui/button";
import type { PublicSharedSessionWave } from "@/lib/shared-session";
import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";

export type SharedSessionWaveClaimState = PublicSharedSessionWave & {
  surfer: SurferProfile | null;
  canClaim: boolean;
  claimStatus: "none" | "claimed" | "auto";
};

export function SharedSessionWaveClaim({
  wave,
  partnerName,
  location,
  onClaimed,
  variant = "overlay",
}: {
  wave: SharedSessionWaveClaimState;
  partnerName: string;
  location: string;
  onClaimed: (surfer: SurferProfile) => void;
  variant?: "overlay" | "inline";
}) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (wave.claimStatus === "claimed" && wave.surfer) {
    if (variant === "overlay") {
      return null;
    }
    return (
      <span className="text-xs text-muted-foreground">
        Claimed by {wave.surfer.displayName?.trim() || "surfer"}
      </span>
    );
  }

  if (!wave.canClaim) {
    if (wave.claimStatus === "claimed") {
      return (
        <span
          className={cn(
            "text-xs text-muted-foreground",
            variant === "inline" && "shrink-0",
          )}
        >
          Already claimed
        </span>
      );
    }
    return null;
  }

  if (isLoading) {
    return null;
  }

  if (!user) {
    const qs = searchParams.toString();
    const returnTo = encodeURIComponent(qs ? `${pathname}?${qs}` : pathname);
    return (
      <Button
        type="button"
        size="sm"
        className={cn(
          variant === "overlay"
            ? "absolute bottom-3 right-3 z-10 h-auto rounded-lg border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-black/85"
            : "border-border bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        onClick={() => {
          window.location.href = `/auth/login?returnTo=${returnTo}`;
        }}
      >
        Sign in to claim
      </Button>
    );
  }

  return (
    <ClaimWaveButton
      variant={variant === "overlay" ? "overlay" : "default"}
      jobId={wave.jobId}
      partnerName={partnerName}
      location={location}
      onClaimed={onClaimed}
    />
  );
}
