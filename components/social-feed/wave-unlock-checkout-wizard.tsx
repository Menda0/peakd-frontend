"use client";

import { ExternalLink, HeartHandshake, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
  fetchWaveCheckoutContext,
  partnerLocationLabel,
  plainPartnerDescription,
  type WaveCheckoutContext,
} from "@/lib/commercial-checkout";
import { startSingleWaveCheckout } from "@/lib/commercial-cart";
import {
  allocateBuyClaimLineBreakdownsMinor,
  formatDiscountSummary,
  paymentProcessingFeeMinor,
  type CheckoutBreakdownMinor,
} from "@/lib/commercial-settings";
import { formatMoney } from "@/lib/currencies";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  formatSessionLocationLabel,
  formatSessionSummary,
  type DiscoverFeedLocation,
} from "@/lib/discover-feed";
import {
  addToWaveUnlockCart,
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
  currency,
  sessionWaveCount,
}: {
  breakdown: CheckoutBreakdownMinor;
  intent: WaveUnlockCartIntent;
  currency: string;
  sessionWaveCount?: number;
}) {
  const processingFeeMinor = paymentProcessingFeeMinor(breakdown);
  return (
    <>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <dt>List price</dt>
        <dd>{formatMoney(breakdown.listPriceMinor, currency)}</dd>
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
              ? `${breakdown.discountPercent}% (−${formatMoney(breakdown.discountSavedMinor, currency)})`
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
        <dt>Partner price</dt>
        <dd>{formatMoney(breakdown.basePriceMinor, currency)}</dd>
      </div>
      {breakdown.commissionMinor > 0 ? (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>Platform commission ({breakdown.commissionPercent}%)</dt>
          <dd>{formatMoney(breakdown.commissionMinor, currency)}</dd>
        </div>
      ) : null}
      {processingFeeMinor > 0 ? (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>Payment processing fee</dt>
          <dd>{formatMoney(processingFeeMinor, currency)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold text-foreground">
        <dt>You pay</dt>
        <dd>{formatMoney(breakdown.totalMinor, currency)}</dd>
      </div>
    </>
  );
}

function CheckoutSummaryPanel({
  intent,
  breakdown,
  currency,
  videoName,
  sessionLabel,
  sessionWaveCount,
}: {
  intent: WaveUnlockCartIntent;
  breakdown: CheckoutBreakdownMinor;
  currency: string;
  videoName: string;
  sessionLabel: string;
  sessionWaveCount: number;
}) {
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
        currency={currency}
        sessionWaveCount={sessionWaveCount}
      />
      <p className="border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
        You&apos;ll be redirected to Stripe Checkout to complete payment in{" "}
        <strong className="text-foreground">{currency}</strong>. This checkout
        includes the partner price, platform commission, and a payment
        processing fee.
        {intent === "sponsor"
          ? " You unlock the video for the surfer on this wave without taking the claim."
          : ""}
      </p>
    </dl>
  );
}

function PriceBreakdown({
  breakdown,
  intent,
  currency,
  sessionWaveCount,
}: {
  breakdown: CheckoutBreakdownMinor;
  intent: WaveUnlockCartIntent;
  currency: string;
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
          currency={currency}
          sessionWaveCount={sessionWaveCount}
        />
      </dl>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Checkout includes partner price, platform commission, and payment
        processing fee.
      </p>
    </div>
  );
}

export function WaveUnlockCheckoutWizard({
  open,
  onOpenChange,
  jobId,
  onPurchased: _onPurchased,
  onClaimed: _onClaimed,
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

  const otherWaves = useMemo(
    () => (ctx?.sessionWaves ?? []).filter((w) => !w.isCurrent).slice(0, 3),
    [ctx],
  );

  const sessionViewHref = ctx?.shareToken
    ? `/share/sessions/${encodeURIComponent(ctx.shareToken)}`
    : null;

  const { items: cartItems } = useWaveUnlockCart();

  const steps = useMemo(() => buildUnlockWizardSteps(), []);

  const currentStep = steps[stepIndex] ?? steps[0];
  const stepMeta = WAVE_UNLOCK_STEP_META[currentStep];
  const isSummary = currentStep === "summary";
  const isFirst = stepIndex === 0;
  const surferName = ctx?.surfer?.displayName?.trim() || "the surfer on this wave";

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
    setActiveJobId(jobId);
  }, [jobId]);

  useEffect(() => {
    if (!open) return;
    reset();
    void loadContext(jobId);
  }, [open, jobId, loadContext, reset]);

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

  const breakdown = useMemo((): CheckoutBreakdownMinor | null => {
    if (!ctx || !intent) return null;
    if (intent === "buy_claim") {
      if (sessionBuyClaimCount <= 1) {
        return ctx.buyClaim;
      }
      const lines = allocateBuyClaimLineBreakdownsMinor(
        ctx.commercialSettings,
        sessionBuyClaimCount,
        ctx.platformCommissionPercent,
      );
      return lines[lines.length - 1] ?? ctx.buyClaim;
    }
    return ctx.sponsor;
  }, [ctx, intent, sessionBuyClaimCount]);

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

  const runBuyNow = async () => {
    if (!ctx || !intent) return;
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await startSingleWaveCheckout({
        jobId: activeJobId,
        intent,
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
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

  if (!open) return null;

  return (
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading checkout…
            </p>
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
                      !ctx.canSponsor &&
                        "cursor-not-allowed opacity-50 hover:border-border",
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
                      !ctx.canBuyClaim &&
                        "cursor-not-allowed opacity-50 hover:border-border",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <User className="size-4 text-primary" aria-hidden />
                      Claim video
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      You buy the video and claim it for yourself. You are the
                      surfer on this wave and get full playback in My Videos.
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
                    currency={ctx.currency}
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
                  <PostSessionInfo session={ctx.sessionSummary} />
                  {otherWaves.length > 0 ? (
                    <ul className="grid gap-2 sm:grid-cols-3">
                      {otherWaves.map((wave) => {
                        const wavePrice =
                          intent === "buy_claim"
                            ? wave.buyClaimTotalMinor
                            : wave.sponsorTotalMinor;
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
                                void loadContext(wave.jobId, {
                                  preserveStep: true,
                                })
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
                                {wavePrice != null
                                  ? ` · ${formatMoney(wavePrice, ctx.currency)}`
                                  : ""}
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
                  currency={ctx.currency}
                  videoName={activeWaveMeta.videoName}
                  sessionLabel={activeWaveMeta.sessionLabel}
                  sessionWaveCount={
                    intent === "buy_claim" ? sessionBuyClaimCount : 1
                  }
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-border bg-popover px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">
              {error}
            </p>
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
                  disabled={submitting || !intent || !breakdown}
                  onClick={() => void runBuyNow()}
                >
                  {submitting
                    ? "Redirecting…"
                    : `Buy now · ${
                        breakdown
                          ? formatMoney(breakdown.totalMinor, ctx?.currency ?? "EUR")
                          : "—"
                      }`}
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
                  (currentStep === "role" &&
                    intent === "buy_claim" &&
                    !ctx.canBuyClaim) ||
                  (currentStep === "role" &&
                    intent === "sponsor" &&
                    !ctx.canSponsor) ||
                  ((currentStep === "details" || currentStep === "session") &&
                    !intent)
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
  );
}
