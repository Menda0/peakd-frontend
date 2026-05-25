"use client";

import { ExternalLink, HeartHandshake, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BuyPeaksDialog } from "@/components/peaks/buy-peaks-dialog";
import { PeakIcon } from "@/components/peaks/peak-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  communityFundLocationLabel,
  fetchWaveCheckoutContext,
  partnerLocationLabel,
  plainPartnerDescription,
  type WaveCheckoutContext,
} from "@/lib/commercial-checkout";
import { buyClaimCartBatch } from "@/lib/commercial-cart";
import { buyClaimWave, fetchPeaksBalance, sponsorWave } from "@/lib/commercial-wave";
import {
  allocateBuyClaimLineBreakdowns,
  formatDiscountSummary,
  type CheckoutPeaksBreakdown,
} from "@/lib/commercial-settings";
import { dispatchWaveClaimedEvent } from "@/lib/claim-wave";
import {
  PEAKS_BALANCE_REFRESH_EVENT,
  fetchWallet,
  type WalletResponse,
} from "@/lib/billing";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  COMMERCIAL_WAVE_UNLOCKED_EVENT,
  formatSessionLocationLabel,
  formatSessionSummary,
  type DiscoverFeedLocation,
} from "@/lib/discover-feed";
import {
  addToWaveUnlockCart,
  removeFromWaveUnlockCart,
  useWaveUnlockCart,
  type WaveUnlockCartIntent,
  type WaveUnlockCartLine,
} from "@/lib/wave-unlock-cart";
import { PostSessionInfo } from "./post-session-info";
import {
  buildUnlockWizardSteps,
  intentLabel,
  WAVE_UNLOCK_STEP_META,
  type WaveUnlockWizardStepId,
} from "@/lib/wave-unlock-wizard";
import { cn } from "@/lib/utils";

function WizardProgress({
  steps,
  stepIndex,
}: {
  steps: WaveUnlockWizardStepId[];
  stepIndex: number;
}) {
  return (
    <nav
      className="flex gap-1.5"
      aria-label={`Step ${stepIndex + 1} of ${steps.length}`}
    >
      {steps.map((id, i) => (
        <div
          key={id}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= stepIndex ? "bg-primary" : "bg-muted",
          )}
          title={WAVE_UNLOCK_STEP_META[id].title}
        />
      ))}
    </nav>
  );
}

function PartnerBlock({ ctx }: { ctx: WaveCheckoutContext }) {
  const description = plainPartnerDescription(ctx.partner.descriptionMarkdown, 3);
  const locationLabel = partnerLocationLabel(ctx.location);

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-white/[0.02] p-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
        {ctx.partner.avatarUrl ? (
          <Image
            src={ctx.partner.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
            {ctx.partner.partnerName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{ctx.partner.partnerName}</p>
        {locationLabel ? (
          <p className="text-xs text-muted-foreground">{locationLabel}</p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PriceLineRows({
  breakdown,
  intent,
  communityFeePercent,
  sessionWaveCount,
  cartTotals,
}: {
  breakdown: CheckoutPeaksBreakdown;
  intent: WaveUnlockCartIntent;
  communityFeePercent: number;
  sessionWaveCount?: number;
  cartTotals?: {
    cartTotalPeaks: number;
    cartCommunityFeePeaks: number;
    totalCommunityFeePeaks: number;
  };
}) {
  return (
    <>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <dt>List price</dt>
        <dd>{breakdown.listPricePeaks} Peaks</dd>
      </div>
      {intent === "buy_claim" ? (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>
            Volume discount
            {sessionWaveCount != null && sessionWaveCount > 1
              ? ` (${sessionWaveCount} waves this session)`
              : null}
          </dt>
          <dd className="text-right text-emerald-400/90">
            {breakdown.discountPercent > 0
              ? `${breakdown.discountPercent}% (−${breakdown.discountPeaksSaved} Peaks)`
              : "None"}
          </dd>
        </div>
      ) : (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>Volume discount</dt>
          <dd className="text-right text-xs">Not applicable for sponsors</dd>
        </div>
      )}
      <div className="flex justify-between gap-4 text-muted-foreground">
        <dt>Price after discount</dt>
        <dd>{breakdown.basePeaks} Peaks</dd>
      </div>
      {breakdown.communityFeePeaks > 0 ? (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>Community fee ({communityFeePercent}%)</dt>
          <dd>{breakdown.communityFeePeaks} Peaks</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold text-foreground">
        <dt>Price of this video</dt>
        <dd>{breakdown.totalPeaks} Peaks</dd>
      </div>
      {cartTotals ? (
        <>
          {cartTotals.cartTotalPeaks > 0 ? (
            <div className="flex justify-between gap-4 font-semibold text-foreground">
              <dt>Total in cart</dt>
              <dd>{cartTotals.cartTotalPeaks} Peaks</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold text-foreground">
            <dt>Total community fees</dt>
            <dd>{cartTotals.totalCommunityFeePeaks} Peaks</dd>
          </div>
        </>
      ) : null}
    </>
  );
}

function CheckoutSummaryPanel({
  intent,
  breakdown,
  communityFeePercent,
  communityLocation,
  videoName,
  sessionLabel,
  sessionWaveCount,
  cartTotals,
}: {
  intent: WaveUnlockCartIntent;
  breakdown: CheckoutPeaksBreakdown;
  communityFeePercent: number;
  communityLocation: string;
  videoName: string;
  sessionLabel: string;
  sessionWaveCount: number;
  cartTotals?: {
    cartTotalPeaks: number;
    cartCommunityFeePeaks: number;
    totalCommunityFeePeaks: number;
  };
}) {
  const communityFeePeaks =
    cartTotals && cartTotals.cartTotalPeaks > 0
      ? cartTotals.totalCommunityFeePeaks
      : breakdown.communityFeePeaks;
  return (
    <dl className="space-y-2 rounded-xl border border-border p-4 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Checkout
      </p>
      <p className="truncate text-sm font-medium text-foreground">{videoName}</p>
      <p className="truncate text-xs text-muted-foreground">{sessionLabel}</p>
      <div className="flex justify-between gap-4 pt-1">
        <dt className="text-muted-foreground">Unlocking as</dt>
        <dd className="text-right text-foreground">{intentLabel(intent)}</dd>
      </div>
      <PriceLineRows
        breakdown={breakdown}
        intent={intent}
        communityFeePercent={communityFeePercent}
        sessionWaveCount={sessionWaveCount}
        cartTotals={cartTotals}
      />
      {communityFeePeaks > 0 ? (
        <p className="border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
          The {communityFeePercent}% community fee ({communityFeePeaks} Peaks
          {cartTotals && cartTotals.cartTotalPeaks > 0
            ? ", including your cart and this video"
            : ""}
          ) goes to the surf community in{" "}
          <strong className="text-foreground">{communityLocation}</strong>.
          {intent === "sponsor"
            ? " You unlock the video for the surfer on this wave without taking the claim."
            : " This helps fund local sessions, spots, and community programs in that area."}
        </p>
      ) : (
        <p className="border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
          No community fee is charged when the session location is undisclosed.
          {intent === "sponsor"
            ? " You unlock the video for the surfer on this wave without taking the claim."
            : null}
        </p>
      )}
    </dl>
  );
}

function PriceBreakdown({
  breakdown,
  intent,
  communityLocation,
  communityFeePercent,
  sessionWaveCount,
}: {
  breakdown: CheckoutPeaksBreakdown;
  intent: WaveUnlockCartIntent;
  communityLocation: string;
  communityFeePercent: number;
  sessionWaveCount?: number;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Cost for this video
      </p>
      <dl className="space-y-2 text-sm">
        <PriceLineRows
          breakdown={breakdown}
          intent={intent}
          communityFeePercent={communityFeePercent}
          sessionWaveCount={sessionWaveCount}
        />
      </dl>
      {breakdown.communityFeePeaks > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          The {communityFeePercent}% community fee ({breakdown.communityFeePeaks} Peaks) supports
          the surf community in{" "}
          <strong className="text-foreground">{communityLocation}</strong>.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          No community fee is charged when the session location is undisclosed.
        </p>
      )}
    </div>
  );
}

export function WaveUnlockCheckoutWizard({
  open,
  onOpenChange,
  jobId,
  onPurchased,
  onClaimed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onPurchased: () => void;
  onClaimed: (surfer: SurferProfile) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [intent, setIntent] = useState<WaveUnlockCartIntent | null>(null);
  const [ctx, setCtx] = useState<WaveCheckoutContext | null>(null);
  const [activeJobId, setActiveJobId] = useState(jobId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [buyPeaksOpen, setBuyPeaksOpen] = useState(false);
  const [pendingBuy, setPendingBuy] = useState(false);

  const otherWaves = useMemo(
    () => (ctx?.sessionWaves ?? []).filter((w) => !w.isCurrent).slice(0, 3),
    [ctx],
  );

  const sessionViewHref = ctx?.shareToken
    ? `/share/sessions/${encodeURIComponent(ctx.shareToken)}`
    : null;

  const { items: cartItems, lines: cartLines } = useWaveUnlockCart();

  const steps = useMemo(() => buildUnlockWizardSteps(), []);

  const communityLocation = useMemo(
    () => (ctx ? communityFundLocationLabel(ctx.location) : ""),
    [ctx],
  );

  const currentStep = steps[stepIndex] ?? steps[0];
  const stepMeta = WAVE_UNLOCK_STEP_META[currentStep];
  const isSummary = currentStep === "summary";
  const isFirst = stepIndex === 0;
  const surferName = ctx?.surfer?.displayName?.trim() || "the surfer on this wave";

  const refreshWallet = useCallback(async () => {
    try {
      setWallet(await fetchWallet());
    } catch {
      setWallet(null);
    }
  }, []);

  const loadContext = useCallback(
    async (id: string, options?: { preserveStep?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWaveCheckoutContext(id);
        setCtx(data);
        setActiveJobId(id);
        if (!options?.preserveStep) {
          setIntent(null);
          setStepIndex(0);
        }
      } catch (e) {
        setCtx(null);
        setError(e instanceof Error ? e.message : "Failed to load checkout");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStepIndex(0);
    setIntent(null);
    setError(null);
    setPendingBuy(false);
    setActiveJobId(jobId);
  }, [jobId]);

  useEffect(() => {
    if (!open) return;
    reset();
    void loadContext(jobId);
    void refreshWallet();
  }, [open, jobId, loadContext, refreshWallet, reset]);

  const sessionBuyClaimCount = useMemo(() => {
    if (!ctx || intent !== "buy_claim") return 0;
    const inCart = cartItems.filter(
      (i) =>
        i.sessionId === ctx.sessionId &&
        i.intent === "buy_claim" &&
        i.jobId !== activeJobId,
    ).length;
    return inCart + 1;
  }, [ctx, intent, cartItems, activeJobId]);

  const breakdown = useMemo((): CheckoutPeaksBreakdown | null => {
    if (!ctx || !intent) return null;
    if (intent === "buy_claim") {
      const lines = allocateBuyClaimLineBreakdowns(
        ctx.commercialSettings,
        sessionBuyClaimCount,
      );
      return lines[lines.length - 1] ?? ctx.buyClaim;
    }
    return ctx.sponsor;
  }, [ctx, intent, sessionBuyClaimCount]);

  const otherCartLines = useMemo(
    () => cartLines.filter((line) => line.jobId !== activeJobId),
    [cartLines, activeJobId],
  );

  const cartSummary = useMemo(() => {
    const cartTotalPeaks = otherCartLines.reduce((sum, line) => sum + line.totalPeaks, 0);
    const cartCommunityFeePeaks = otherCartLines.reduce(
      (sum, line) => sum + line.communityFeePeaks,
      0,
    );
    const thisCommunityFee = breakdown?.communityFeePeaks ?? 0;
    const checkoutVideoCount = 1 + otherCartLines.length;
    const checkoutTotalPeaks = (breakdown?.totalPeaks ?? 0) + cartTotalPeaks;
    return {
      cartTotalPeaks,
      cartItemCount: otherCartLines.length,
      cartCommunityFeePeaks,
      totalCommunityFeePeaks: cartCommunityFeePeaks + thisCommunityFee,
      checkoutVideoCount,
      checkoutTotalPeaks,
      cartTotals: breakdown
        ? {
            cartTotalPeaks,
            cartCommunityFeePeaks,
            totalCommunityFeePeaks: cartCommunityFeePeaks + thisCommunityFee,
          }
        : undefined,
    };
  }, [otherCartLines, breakdown]);

  const activeWaveMeta = useMemo(() => {
    const wave = ctx?.sessionWaves.find((w) => w.jobId === activeJobId);
    const sessionLabel = ctx
      ? formatSessionSummary(
          ctx.location as DiscoverFeedLocation,
          ctx.sessionSummary,
        )
      : "";
    return {
      videoName: wave?.originalFilename ?? "Video",
      sessionLabel,
    };
  }, [ctx, activeJobId]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const goNext = () => {
    if (currentStep === "role") {
      if (intent === "buy_claim" && !ctx?.canBuyClaim) {
        setError("Claim video is not available for this wave.");
        return;
      }
      if (intent === "sponsor" && !ctx?.canSponsor) {
        setError("Sponsor unlock is not available for this wave.");
        return;
      }
      if (intent !== "buy_claim" && intent !== "sponsor") {
        setError("Choose Sponsor or Claim video to continue.");
        return;
      }
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const runPurchase = async () => {
    if (!ctx || !intent || !breakdown) return;
    setError(null);
    const cost = cartSummary.checkoutTotalPeaks;
    const balance = wallet?.peaksBalance ?? (await fetchPeaksBalance().catch(() => 0));
    if (balance < cost) {
      setPendingBuy(true);
      setBuyPeaksOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      if (otherCartLines.length === 0) {
        if (intent === "buy_claim") {
          const { surfer } = await buyClaimWave(activeJobId, 1);
          dispatchWaveClaimedEvent();
          onClaimed(surfer);
        } else {
          await sponsorWave(activeJobId);
        }
        toast.success(
          intent === "buy_claim"
            ? "Wave claimed and video unlocked"
            : "Video unlocked for the surfer",
        );
      } else {
        const buyClaimBySession = new Map<string, string[]>();
        const sponsors: WaveUnlockCartLine[] = [];

        for (const line of otherCartLines) {
          if (line.intent === "sponsor") {
            sponsors.push(line);
            continue;
          }
          const bucket = buyClaimBySession.get(line.sessionId) ?? [];
          bucket.push(line.jobId);
          buyClaimBySession.set(line.sessionId, bucket);
        }

        if (intent === "buy_claim") {
          const bucket = buyClaimBySession.get(ctx.sessionId) ?? [];
          bucket.push(activeJobId);
          buyClaimBySession.set(ctx.sessionId, bucket);
        }

        let claimedCurrent = false;
        for (const [, jobIds] of buyClaimBySession) {
          await buyClaimCartBatch(jobIds);
          if (jobIds.includes(activeJobId)) claimedCurrent = true;
          for (const id of jobIds) removeFromWaveUnlockCart(id);
          dispatchWaveClaimedEvent();
        }

        if (intent === "sponsor") {
          await sponsorWave(activeJobId);
          removeFromWaveUnlockCart(activeJobId);
        }

        for (const line of sponsors) {
          await sponsorWave(line.jobId);
          removeFromWaveUnlockCart(line.jobId);
        }

        if (intent === "buy_claim" && claimedCurrent && ctx.surfer) {
          onClaimed(ctx.surfer);
        }

        const unlockedCount = cartSummary.checkoutVideoCount;
        toast.success(
          unlockedCount === 1
            ? intent === "buy_claim"
              ? "Wave claimed and video unlocked"
              : "Video unlocked for the surfer"
            : `${unlockedCount} videos unlocked`,
        );
      }
      window.dispatchEvent(new CustomEvent(PEAKS_BALANCE_REFRESH_EVENT));
      window.dispatchEvent(new CustomEvent(COMMERCIAL_WAVE_UNLOCKED_EVENT));
      void refreshWallet();
      onPurchased();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!ctx || !intent || !breakdown) return;
    const wave = ctx.sessionWaves.find((w) => w.jobId === activeJobId);
    addToWaveUnlockCart({
      jobId: activeJobId,
      intent,
      sessionId: ctx.sessionId,
      sessionLabel: activeWaveMeta.sessionLabel,
      videoName: wave?.originalFilename ?? "Video",
      thumbnailUrl: wave?.thumbnailUrl ?? null,
      addedAt: new Date().toISOString(),
    });
    toast.success("Added to cart — checkout when you're ready");
    close();
  };

  const retryAfterTopUp = async () => {
    if (!pendingBuy || !breakdown) return;
    const balance = await fetchPeaksBalance();
    if (balance < cartSummary.checkoutTotalPeaks) return;
    setPendingBuy(false);
    void runPurchase();
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
          aria-labelledby="unlock-wizard-title"
          className="flex max-h-[min(90dvh,720px)] w-full max-w-3xl flex-col gap-0 overflow-hidden border-border bg-popover py-0 text-foreground ring-white/10"
        >
          <CardHeader className="shrink-0 space-y-3 border-b border-border px-6 pt-6 pb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <CardTitle id="unlock-wizard-title">{stepMeta.title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {stepMeta.description}
              </CardDescription>
            </div>
            {!loading && ctx ? (
              <WizardProgress steps={steps} stepIndex={stepIndex} />
            ) : null}
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading checkout…</p>
            ) : error && !ctx ? (
              <p className="py-6 text-center text-sm text-red-400">{error}</p>
            ) : ctx ? (
              <div className="space-y-4">
                {currentStep === "role" ? (
                  <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
                    <button
                      type="button"
                      aria-pressed={intent === "sponsor"}
                      disabled={!ctx.canSponsor}
                      onClick={() => setIntent("sponsor")}
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                        intent === "sponsor"
                          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                          : "border-border bg-white/[0.02] hover:border-primary/40",
                        !ctx.canSponsor && "cursor-not-allowed opacity-50 hover:border-border",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <HeartHandshake className="size-4 text-primary" aria-hidden />
                        Sponsor
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {ctx.claimStatus === "claimed"
                          ? `You pay to unlock the full video for ${surferName}. You are not the surfer on this wave and do not take the claim.`
                          : "You pay to unlock the full video for yourself without claiming the wave. A surfer can still claim it later."}
                      </span>
                      {!ctx.canSponsor ? (
                        <span className="text-xs text-muted-foreground">
                          {ctx.claimStatus === "claimed"
                            ? "You already claimed this wave — choose Claim video to buy and unlock as the surfer."
                            : "This wave is already unlocked."}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      aria-pressed={intent === "buy_claim"}
                      disabled={!ctx.canBuyClaim}
                      onClick={() => setIntent("buy_claim")}
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                        intent === "buy_claim"
                          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                          : "border-border bg-white/[0.02] hover:border-primary/40",
                        !ctx.canBuyClaim && "cursor-not-allowed opacity-50 hover:border-border",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <User className="size-4 text-primary" aria-hidden />
                        Claim video
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        You buy the video and claim it for yourself. You are the surfer on this
                        wave and get full playback in My Videos.
                      </span>
                      {!ctx.canBuyClaim ? (
                        <span className="text-xs text-muted-foreground">
                          Buy and claim is not available for this wave.
                        </span>
                      ) : null}
                    </button>
                  </div>
                ) : null}

                {currentStep === "details" && breakdown && intent ? (
                  <div className="space-y-4">
                    <PartnerBlock ctx={ctx} />
                    <PriceBreakdown
                      breakdown={breakdown}
                      intent={intent}
                      communityLocation={communityLocation}
                      communityFeePercent={ctx.communityFeePercent}
                      sessionWaveCount={
                        intent === "buy_claim" ? sessionBuyClaimCount : undefined
                      }
                    />
                    <div className="rounded-xl border border-dashed border-border p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Partner pricing for this session
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDiscountSummary(ctx.commercialSettings)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {currentStep === "session" && intent && ctx ? (
                  <div className="space-y-4">
                    <PostSessionInfo
                      sessionSummary={formatSessionSummary(
                        ctx.location as DiscoverFeedLocation,
                        ctx.sessionSummary,
                      )}
                      session={ctx.sessionSummary}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatSessionLocationLabel(ctx.location as DiscoverFeedLocation)}
                    </p>
                    {otherWaves.length > 0 ? (
                      <ul className="grid gap-2 sm:grid-cols-3">
                        {otherWaves.map((wave) => {
                          const wavePrice =
                            intent === "buy_claim"
                              ? wave.buyClaimTotalPeaks
                              : wave.sponsorTotalPeaks;
                          const canUnlock =
                            intent === "buy_claim"
                              ? wave.canBuyClaim
                              : wave.canSponsor;
                          return (
                            <li key={wave.jobId}>
                              <button
                                type="button"
                                disabled={!canUnlock}
                                onClick={() =>
                                  void loadContext(wave.jobId, { preserveStep: true })
                                }
                                className={cn(
                                  "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors",
                                  wave.jobId === activeJobId
                                    ? "border-primary/50 ring-1 ring-primary/30"
                                    : "border-border hover:border-border",
                                  !canUnlock && "opacity-50",
                                )}
                              >
                                <div className="relative aspect-video bg-secondary">
                                  {wave.thumbnailUrl ? (
                                    <Image
                                      src={wave.thumbnailUrl}
                                      alt=""
                                      fill
                                      className="object-cover"
                                      sizes="160px"
                                      unoptimized
                                    />
                                  ) : (
                                    <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <span className="truncate px-2 py-1.5 text-[10px] text-muted-foreground">
                                  {wave.originalFilename}
                                  {wavePrice != null ? ` · ${wavePrice} P` : ""}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No other unlockable waves in this session right now.
                      </p>
                    )}
                    {sessionViewHref ? (
                      <Link
                        href={sessionViewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/15"
                      >
                        View all videos on this session
                        <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === "summary" && breakdown && intent ? (
                  <CheckoutSummaryPanel
                    intent={intent}
                    breakdown={breakdown}
                    communityFeePercent={ctx.communityFeePercent}
                    communityLocation={communityLocation}
                    videoName={activeWaveMeta.videoName}
                    sessionLabel={activeWaveMeta.sessionLabel}
                    sessionWaveCount={
                      intent === "buy_claim" ? sessionBuyClaimCount : 1
                    }
                    cartTotals={cartSummary.cartTotals}
                  />
                ) : null}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-border bg-popover px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {error ? (
              <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">{error}</p>
            ) : (
              <span className="hidden sm:block sm:flex-1" aria-hidden />
            )}
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border bg-transparent text-foreground"
                disabled={submitting}
                onClick={close}
              >
                Cancel
              </Button>
              {!isFirst ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-border bg-transparent text-foreground"
                  disabled={submitting || loading}
                  onClick={goBack}
                >
                  Back
                </Button>
              ) : null}
              {isSummary ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-transparent text-foreground"
                    disabled={submitting || !intent}
                    onClick={handleAddToCart}
                  >
                    Add to cart
                  </Button>
                  <Button
                    type="button"
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitting || !intent}
                    onClick={() => void runPurchase()}
                  >
                    {submitting ? (
                      "Processing…"
                    ) : (
                      <>
                        Buy {cartSummary.checkoutVideoCount}{" "}
                        {cartSummary.checkoutVideoCount === 1 ? "video" : "videos"}{" "}
                        now
                        <PeakIcon size={18} className="size-[18px]" />
                        <span className="tabular-nums">
                          {cartSummary.checkoutTotalPeaks}
                        </span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={
                    loading ||
                    !ctx ||
                    (currentStep === "role" &&
                      (intent !== "buy_claim" && intent !== "sponsor")) ||
                    (currentStep === "role" &&
                      intent === "buy_claim" &&
                      !ctx.canBuyClaim) ||
                    (currentStep === "role" &&
                      intent === "sponsor" &&
                      !ctx.canSponsor) ||
                    ((currentStep === "details" || currentStep === "session") && !intent)
                  }
                  onClick={goNext}
                >
                  Next
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      <BuyPeaksDialog
        open={buyPeaksOpen}
        onOpenChange={(o) => {
          setBuyPeaksOpen(o);
          if (!o && pendingBuy) void retryAfterTopUp();
        }}
        wallet={wallet}
        onWalletRefresh={refreshWallet}
      />
    </>
  );
}
