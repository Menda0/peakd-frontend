"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchWaveOrderStatus,
  type WaveOrderStatusDto,
} from "@/lib/commercial-cart";
import { formatMoney } from "@/lib/currencies";
import { COMMERCIAL_WAVE_UNLOCKED_EVENT } from "@/lib/discover-feed";
import { clearWaveUnlockCart } from "@/lib/wave-unlock-cart";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

export function OrderReturnPanel({
  orderId,
  canceled,
  userSub,
}: {
  orderId: string;
  canceled: boolean;
  userSub: string;
}) {
  const [status, setStatus] = useState<WaveOrderStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const cleanupDoneRef = useRef(false);

  useEffect(() => {
    if (canceled || !orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const dto = await fetchWaveOrderStatus(orderId);
        if (cancelled) return;
        setStatus(dto);
        setError(null);
        if (dto.status === "completed") {
          if (!cleanupDoneRef.current) {
            cleanupDoneRef.current = true;
            clearWaveUnlockCart();
            window.dispatchEvent(new CustomEvent(COMMERCIAL_WAVE_UNLOCKED_EVENT));
          }
          setPolling(false);
          return;
        }
        if (dto.status === "failed") {
          setPolling(false);
          return;
        }
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPolling(false);
          setError(
            "Still waiting for Stripe — refresh this page in a moment.",
          );
          return;
        }
        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load order status");
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPolling(false);
          return;
        }
        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
      }
    };

    setPolling(true);
    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, canceled]);

  if (canceled) {
    return (
      <Card className="border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription className="text-muted-foreground">
            No payment was taken. Your cart is still saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${encodeURIComponent(userSub)}`}>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Back to feed
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!orderId) {
    return (
      <Card className="border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle>Missing order reference</CardTitle>
          <CardDescription className="text-red-400/90">
            We couldn&apos;t find the order ID in this link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${encodeURIComponent(userSub)}`}>
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent text-foreground"
            >
              Back to feed
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const renderTotals = (dto: WaveOrderStatusDto) => {
    const paymentProcessingFeeMinor = Math.max(
      0,
      dto.totalAmountMinor - dto.partnerSubtotalMinor - dto.platformCommissionMinor,
    );
    return (
      <dl className="grid gap-2 rounded-lg border border-border bg-white/[0.02] p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Partner amount</dt>
          <dd>{formatMoney(dto.partnerSubtotalMinor, dto.currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Platform commission</dt>
          <dd>{formatMoney(dto.platformCommissionMinor, dto.currency)}</dd>
        </div>
        {paymentProcessingFeeMinor > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment processing fee</dt>
            <dd>{formatMoney(paymentProcessingFeeMinor, dto.currency)}</dd>
          </div>
        ) : null}
      <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
        <dt>Total charged</dt>
        <dd>{formatMoney(dto.totalAmountMinor, dto.currency)}</dd>
      </div>
      <div className="flex justify-between gap-4 pt-1 text-xs text-muted-foreground">
        <dt>Videos unlocked</dt>
        <dd>{dto.jobIds.length}</dd>
      </div>
      </dl>
    );
  };

  if (status?.status === "completed") {
    return (
      <Card className="border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle>Payment confirmed</CardTitle>
          <CardDescription className="text-muted-foreground">
            Thanks! Your{" "}
            {status.intent === "sponsor" ? "sponsored " : ""}videos are unlocked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderTotals(status)}
          <div className="flex flex-wrap gap-2">
            <Link href={`/${encodeURIComponent(userSub)}/my-videos`}>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Watch in My Videos
              </Button>
            </Link>
            <Link href={`/${encodeURIComponent(userSub)}`}>
              <Button
                type="button"
                variant="outline"
                className="border-border bg-transparent text-foreground"
              >
                Back to feed
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status?.status === "failed") {
    return (
      <Card className="border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle>Payment failed</CardTitle>
          <CardDescription className="text-red-400/90">
            {status.failureReason ??
              "Stripe reported a failure. No videos were unlocked."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${encodeURIComponent(userSub)}`}>
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent text-foreground"
            >
              Back to feed
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card text-foreground">
      <CardHeader>
        <CardTitle>
          {polling ? "Waiting for Stripe…" : "Almost there"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Stripe is finalizing the payment. This usually takes a few seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? renderTotals(status) : null}
        {error ? <p className="text-sm text-red-400/90">{error}</p> : null}
        <p className="text-xs text-muted-foreground">
          You can safely stay on this page — it will update automatically when the
          payment is confirmed.
        </p>
      </CardContent>
    </Card>
  );
}
