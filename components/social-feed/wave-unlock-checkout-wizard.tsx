"use client";

import { ExternalLink, HeartHandshake, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  communityFundLocationLabel,
  fetchWaveCheckoutContext,
  partnerLocationLabel,
  plainPartnerDescription,
  type WaveCheckoutContext,
} from "@/lib/commercial-checkout";
import { buyClaimWave, fetchPeaksBalance, sponsorWave } from "@/lib/commercial-wave";
import { formatDiscountSummary } from "@/lib/commercial-settings";
import { dispatchWaveClaimedEvent } from "@/lib/claim-wave";
import {
  fetchWallet,
  PEAKS_BALANCE_REFRESH_EVENT,
  type WalletResponse,
} from "@/lib/billing";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  formatSessionLocationLabel,
  formatSessionSummary,
  type DiscoverFeedLocation,
} from "@/lib/discover-feed";
import {
  addToWaveUnlockCart,
  cartTotalPeaks,
  useWaveUnlockCart,
  type WaveUnlockCartIntent,
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
            i <= stepIndex ? "bg-primary" : "bg-white/10",
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
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
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
          <span className="flex size-full items-center justify-center text-sm font-semibold text-zinc-500">
            {ctx.partner.partnerName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{ctx.partner.partnerName}</p>
        {locationLabel ? (
          <p className="text-xs text-zinc-500">{locationLabel}</p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutSummaryPanel({
  intent,
  breakdown,
  communityFeePercent,
  cartPeaks,
  cartItemCount,
  combinedTotal,
}: {
  intent: WaveUnlockCartIntent;
  breakdown: WaveCheckoutContext["buyClaim"];
  communityFeePercent: number;
  cartPeaks: number;
  cartItemCount: number;
  combinedTotal: number;
}) {
  return (
    <div className="space-y-4">
      {cartItemCount > 0 ? (
        <dl className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Your cart
          </p>
          <div className="flex justify-between gap-4 text-zinc-400">
            <dt>
              Cart ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
            </dt>
            <dd className="text-zinc-200">{cartPeaks} Peaks</dd>
          </div>
        </dl>
      ) : null}

      <dl className="space-y-2 rounded-xl border border-white/10 p-4 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          This video
        </p>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Unlocking as</dt>
          <dd className="text-right text-zinc-100">{intentLabel(intent)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-zinc-400">
          <dt>List price</dt>
          <dd>{breakdown.listPricePeaks} Peaks</dd>
        </div>
        {intent === "buy_claim" ? (
          <div className="flex justify-between gap-4 text-zinc-400">
            <dt>Volume discount</dt>
            <dd className="text-right text-emerald-400/90">
              {breakdown.discountPercent > 0
                ? `${breakdown.discountPercent}% (−${breakdown.discountPeaksSaved} Peaks)`
                : "None (1 wave)"}
            </dd>
          </div>
        ) : (
          <div className="flex justify-between gap-4 text-zinc-500">
            <dt>Volume discount</dt>
            <dd className="text-right text-xs">Not applicable for sponsors</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 text-zinc-400">
          <dt>Wave price after discount</dt>
          <dd>{breakdown.basePeaks} Peaks</dd>
        </div>
        <div className="flex justify-between gap-4 text-zinc-400">
          <dt>Community fee ({communityFeePercent}%)</dt>
          <dd>{breakdown.communityFeePeaks} Peaks</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-zinc-50">
          <dt>This video total</dt>
          <dd>{breakdown.totalPeaks} Peaks</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-xs text-zinc-500">Combined total (cart + this video)</p>
        <p className="text-2xl font-semibold text-zinc-50">{combinedTotal} Peaks</p>
        <p className="mt-1 text-xs text-zinc-500">
          Buy now charges {breakdown.totalPeaks} Peaks for this video only.
        </p>
      </div>
    </div>
  );
}

function PriceBreakdown({
  breakdown,
  communityLocation,
  communityFeePercent,
}: {
  breakdown: WaveCheckoutContext["buyClaim"];
  communityLocation: string;
  communityFeePercent: number;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Cost for this video
      </p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <dt>Wave price</dt>
          <dd className="text-zinc-200">{breakdown.basePeaks} Peaks</dd>
        </div>
        <div className="flex justify-between text-zinc-400">
          <dt>Community fee ({communityFeePercent}%)</dt>
          <dd className="text-zinc-200">{breakdown.communityFeePeaks} Peaks</dd>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-zinc-50">
          <dt>Total</dt>
          <dd>{breakdown.totalPeaks} Peaks</dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-zinc-500">
        The {communityFeePercent}% community fee ({breakdown.communityFeePeaks} Peaks) supports
        the surf community in{" "}
        <strong className="text-zinc-300">{communityLocation}</strong>.
      </p>
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

  const { items: cartItems } = useWaveUnlockCart();

  const steps = useMemo(
    () =>
      buildUnlockWizardSteps(ctx?.canBuyClaim ?? false, ctx?.canSponsor ?? false),
    [ctx?.canBuyClaim, ctx?.canSponsor],
  );

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
          const pickRole = data.canBuyClaim && data.canSponsor;
          if (pickRole) {
            setIntent(null);
          } else {
            setIntent(
              data.canBuyClaim ? "buy_claim" : data.canSponsor ? "sponsor" : null,
            );
          }
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

  const breakdown = useMemo(() => {
    if (!ctx || !intent) return null;
    return intent === "buy_claim" ? ctx.buyClaim : ctx.sponsor;
  }, [ctx, intent]);

  const cartSummary = useMemo(() => {
    const others = cartItems.filter((i) => i.jobId !== activeJobId);
    const cartPeaks = cartTotalPeaks(others);
    const thisTotal = breakdown?.totalPeaks ?? 0;
    return {
      cartPeaks,
      cartItemCount: others.length,
      combinedTotal: cartPeaks + thisTotal,
    };
  }, [cartItems, activeJobId, breakdown?.totalPeaks]);

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
      if (intent !== "buy_claim" && intent !== "sponsor") {
        setError("Choose how you are unlocking this video.");
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
    const cost = breakdown.totalPeaks;
    const balance = wallet?.peaksBalance ?? (await fetchPeaksBalance().catch(() => 0));
    if (balance < cost) {
      setPendingBuy(true);
      setBuyPeaksOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      if (intent === "buy_claim") {
        const { surfer } = await buyClaimWave(activeJobId, 1);
        dispatchWaveClaimedEvent();
        onClaimed(surfer);
      } else {
        await sponsorWave(activeJobId);
      }
      window.dispatchEvent(new CustomEvent(PEAKS_BALANCE_REFRESH_EVENT));
      void refreshWallet();
      onPurchased();
      toast.success(
        intent === "buy_claim"
          ? "Wave claimed and video unlocked"
          : "Video unlocked for the surfer",
      );
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!ctx || !intent || !breakdown) return;
    const label =
      intent === "buy_claim"
        ? `Buy & claim · ${ctx.partner.partnerName}`
        : `Sponsor unlock · ${surferName}`;
    addToWaveUnlockCart({
      jobId: activeJobId,
      intent,
      quantity: 1,
      label,
      totalPeaks: breakdown.totalPeaks,
      addedAt: new Date().toISOString(),
    });
    toast.success("Added to cart — checkout when you're ready");
    close();
  };

  const retryAfterTopUp = async () => {
    if (!pendingBuy || !breakdown) return;
    const balance = await fetchPeaksBalance();
    if (balance < breakdown.totalPeaks) return;
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
          className="flex max-h-[min(90dvh,720px)] w-full max-w-3xl flex-col gap-0 overflow-hidden border-white/10 bg-[#0a1218] py-0 text-zinc-100 ring-white/10"
        >
          <CardHeader className="shrink-0 space-y-3 border-b border-white/10 px-6 pt-6 pb-4">
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <CardTitle id="unlock-wizard-title">{stepMeta.title}</CardTitle>
              <CardDescription className="text-zinc-500">
                {stepMeta.description}
              </CardDescription>
            </div>
            {!loading && ctx ? (
              <WizardProgress steps={steps} stepIndex={stepIndex} />
            ) : null}
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-500">Loading checkout…</p>
            ) : error && !ctx ? (
              <p className="py-6 text-center text-sm text-red-400">{error}</p>
            ) : ctx ? (
              <div className="space-y-4">
                {currentStep === "role" ? (
                  <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
                    {ctx.canBuyClaim ? (
                      <button
                        type="button"
                        aria-pressed={intent === "buy_claim"}
                        onClick={() => setIntent("buy_claim")}
                        className={cn(
                          "flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                          intent === "buy_claim"
                            ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                            : "border-white/10 bg-white/[0.02] hover:border-primary/40",
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
                          <User className="size-4 text-primary" aria-hidden />
                          I am the surfer — buy and claim
                        </span>
                        <span className="text-xs leading-relaxed text-zinc-500">
                          Pay Peaks to buy this wave and claim it for yourself. You become the
                          surfer on the video and unlock full playback in My Videos.
                        </span>
                      </button>
                    ) : null}
                    {ctx.canSponsor ? (
                      <button
                        type="button"
                        aria-pressed={intent === "sponsor"}
                        onClick={() => setIntent("sponsor")}
                        className={cn(
                          "flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                          intent === "sponsor"
                            ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                            : "border-white/10 bg-white/[0.02] hover:border-primary/40",
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
                          <HeartHandshake className="size-4 text-primary" aria-hidden />
                          I am a sponsor — buy unlock only
                        </span>
                        <span className="text-xs leading-relaxed text-zinc-500">
                          Pay Peaks to unlock the video for {surferName} without claiming the
                          wave. You do not become the surfer — they keep claim.
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === "details" && breakdown && intent ? (
                  <div className="space-y-4">
                    <PartnerBlock ctx={ctx} />
                    <PriceBreakdown
                      breakdown={breakdown}
                      communityLocation={communityLocation}
                      communityFeePercent={ctx.communityFeePercent}
                    />
                    <div className="rounded-xl border border-dashed border-white/10 p-3">
                      <p className="text-xs font-medium text-zinc-400">
                        Partner pricing for this session
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
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
                    <p className="text-xs text-zinc-500">
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
                                    : "border-white/10 hover:border-white/20",
                                  !canUnlock && "opacity-50",
                                )}
                              >
                                <div className="relative aspect-video bg-zinc-900">
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
                                    <span className="flex size-full items-center justify-center text-[10px] text-zinc-600">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <span className="truncate px-2 py-1.5 text-[10px] text-zinc-400">
                                  {wave.originalFilename}
                                  {wavePrice != null ? ` · ${wavePrice} P` : ""}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        No other unlockable waves in this session right now.
                      </p>
                    )}
                    {sessionViewHref ? (
                      <Link
                        href={sessionViewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-primary/15"
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
                    cartPeaks={cartSummary.cartPeaks}
                    cartItemCount={cartSummary.cartItemCount}
                    combinedTotal={cartSummary.combinedTotal}
                  />
                ) : null}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-white/10 bg-[#0a1218] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {error ? (
              <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">{error}</p>
            ) : (
              <span className="hidden sm:block sm:flex-1" aria-hidden />
            )}
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-transparent text-zinc-200"
                disabled={submitting}
                onClick={close}
              >
                Cancel
              </Button>
              {!isFirst ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-transparent text-zinc-200"
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
                    className="border-white/15 bg-transparent text-zinc-200"
                    disabled={submitting || !intent}
                    onClick={handleAddToCart}
                  >
                    Add to cart
                  </Button>
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitting || !intent}
                    onClick={() => void runPurchase()}
                  >
                    {submitting
                      ? "Processing…"
                      : `Buy video now · ${breakdown?.totalPeaks ?? 0} Peaks`}
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
                      intent !== "buy_claim" &&
                      intent !== "sponsor") ||
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
