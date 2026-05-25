"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PeakIcon } from "@/components/peaks/peak-icon";
import { formatEur, formatPeaksCount } from "@/lib/billing";
import {
  type PartnerEarningsPageDto,
  type PartnerOnboardingStatus,
  type PartnerPayoutsStatusDto,
  type PartnerWithdrawalDto,
  type PartnerWithdrawalStatus,
} from "@/lib/partner-payouts";
import {
  type PartnerPayoutsActionResult,
  getPartnerPayoutsStatusAction,
  listPartnerEarningsAction,
  requestPartnerWithdrawalAction,
  startPartnerOnboardingAction,
} from "@/app/[userSub]/(social)/partner/income/actions";

type StatusBadge = {
  label: string;
  className: string;
  icon: React.ReactNode;
};

const ONBOARDING_BADGES: Record<PartnerOnboardingStatus, StatusBadge> = {
  not_started: {
    label: "Not connected",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: <ArrowDownToLineIcon className="size-3.5" aria-hidden />,
  },
  pending: {
    label: "Onboarding incomplete",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: <Loader2Icon className="size-3.5 animate-spin" aria-hidden />,
  },
  enabled: {
    label: "Bank connected",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: <CheckCircle2Icon className="size-3.5" aria-hidden />,
  },
};

const WITHDRAWAL_BADGES: Record<PartnerWithdrawalStatus, StatusBadge> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: <Loader2Icon className="size-3.5 animate-spin" aria-hidden />,
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: <CheckCircle2Icon className="size-3.5" aria-hidden />,
  },
  failed: {
    label: "Failed",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: <XCircleIcon className="size-3.5" aria-hidden />,
  },
};

function StatusBadgeChip({ badge }: { badge: StatusBadge }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function peaksToCents(peaks: number, peaksPerEuro: number): number {
  if (peaksPerEuro <= 0) return 0;
  return Math.floor((peaks * 100) / peaksPerEuro);
}

export function PartnerIncomeDashboard({
  initialStatus,
  initialEarnings,
}: {
  initialStatus: PartnerPayoutsActionResult<PartnerPayoutsStatusDto>;
  initialEarnings: PartnerPayoutsActionResult<PartnerEarningsPageDto>;
}) {
  const [status, setStatus] = useState<PartnerPayoutsStatusDto | null>(
    initialStatus.ok ? initialStatus.data : null,
  );
  const [statusError, setStatusError] = useState<string | null>(
    initialStatus.ok ? null : initialStatus.error,
  );
  const [earnings, setEarnings] = useState<PartnerEarningsPageDto | null>(
    initialEarnings.ok ? initialEarnings.data : null,
  );
  const [earningsError, setEarningsError] = useState<string | null>(
    initialEarnings.ok ? null : initialEarnings.error,
  );
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState<
    "withdraw" | "onboarding" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const res = await getPartnerPayoutsStatusAction();
    if (res.ok) {
      setStatus(res.data);
      setStatusError(null);
    } else {
      setStatusError(res.error);
    }
  }, []);

  const refreshEarnings = useCallback(async () => {
    const res = await listPartnerEarningsAction({ limit: 20 });
    if (res.ok) {
      setEarnings(res.data);
      setEarningsError(null);
    } else {
      setEarningsError(res.error);
    }
  }, []);

  useEffect(() => {
    // If the user just returned from Stripe onboarding (`?refresh=1`), pull
    // the latest cached state in case the webhook is still in flight. Deferred
    // so the state update doesn't cascade inside the same render pass.
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("refresh") !== "1") return;
    const handle = window.setTimeout(() => {
      void refreshStatus();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [refreshStatus]);

  const onConnect = useCallback(async () => {
    setActionError(null);
    setActionSuccess(null);
    setSubmitting("onboarding");
    try {
      const res = await startPartnerOnboardingAction();
      if (!res.ok) {
        setActionError(res.error);
        setSubmitting(null);
        return;
      }
      window.location.href = res.data.url;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Onboarding failed");
      setSubmitting(null);
    }
  }, []);

  const peaksAmount = useMemo(() => {
    const trimmed = amountText.trim();
    if (!trimmed) return null;
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [amountText]);

  const onWithdraw = useCallback(async () => {
    if (!status || peaksAmount == null) return;
    setActionError(null);
    setActionSuccess(null);
    if (peaksAmount > status.withdrawablePeaks) {
      setActionError("Amount exceeds available balance");
      return;
    }
    if (peaksAmount < status.minWithdrawalPeaks) {
      setActionError(
        `Minimum withdrawal is ${formatPeaksCount(status.minWithdrawalPeaks)} Peaks`,
      );
      return;
    }
    setSubmitting("withdraw");
    try {
      const res = await requestPartnerWithdrawalAction(peaksAmount);
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      setActionSuccess(
        `Sent ${formatEur(res.data.amountCents)} to your bank account.`,
      );
      setAmountText("");
      await Promise.all([refreshStatus(), refreshEarnings()]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setSubmitting(null);
    }
  }, [peaksAmount, refreshEarnings, refreshStatus, status]);

  const onMaxClick = useCallback(() => {
    if (!status) return;
    setAmountText(String(status.withdrawablePeaks));
  }, [status]);

  if (!status) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold">Income</h1>
        <Card>
          <CardHeader>
            <CardTitle>We couldn’t load your earnings</CardTitle>
            <CardDescription>{statusError ?? "Try again later."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onboardingBadge = ONBOARDING_BADGES[status.onboardingStatus];
  const peaksPerEuro = status.peaksPerEuro;
  const previewCents =
    peaksAmount != null ? peaksToCents(peaksAmount, peaksPerEuro) : 0;
  const canWithdraw =
    status.onboardingStatus === "enabled" &&
    status.withdrawablePeaks >= status.minWithdrawalPeaks;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Income</h1>
        <p className="text-sm text-muted-foreground">
          Cash out the Peaks you earned from commercial wave unlocks straight to
          your bank account via Stripe.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Withdrawable balance</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PeakIcon size={24} />
              {formatPeaksCount(status.withdrawablePeaks)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ≈ {formatEur(status.withdrawableAmountCents)} at{" "}
              {formatPeaksCount(peaksPerEuro)} Peaks per €1
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum withdrawal:{" "}
              {formatPeaksCount(status.minWithdrawalPeaks)} Peaks (
              {formatEur(status.minWithdrawalAmountCents)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bank account</CardDescription>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Stripe Connect</span>
              <StatusBadgeChip badge={onboardingBadge} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.onboardingStatus === "enabled" ? (
              <p className="text-sm text-muted-foreground">
                You’re all set. Withdrawals are sent to your connected bank account.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {status.onboardingStatus === "not_started"
                  ? "Connect a bank account to enable withdrawals."
                  : "Finish Stripe onboarding to unlock withdrawals."}
              </p>
            )}
            {status.requirementsDue.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {status.requirementsDue.slice(0, 5).map((req) => (
                  <li key={req}>{req}</li>
                ))}
                {status.requirementsDue.length > 5 ? (
                  <li>…and {status.requirementsDue.length - 5} more</li>
                ) : null}
              </ul>
            ) : null}
            <Button
              type="button"
              variant={
                status.onboardingStatus === "enabled" ? "outline" : "default"
              }
              onClick={onConnect}
              disabled={submitting === "onboarding"}
            >
              {submitting === "onboarding" ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <ExternalLinkIcon className="size-4" aria-hidden />
              )}
              {status.onboardingStatus === "enabled"
                ? "Update bank details"
                : status.onboardingStatus === "pending"
                  ? "Continue onboarding"
                  : "Connect bank account"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdraw</CardTitle>
          <CardDescription>
            Funds are transferred to your Stripe Connect account; Stripe pays out
            to your bank on its standard schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Peaks</span>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amountText}
                  onChange={(e) =>
                    setAmountText(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder={String(status.minWithdrawalPeaks)}
                  className="w-40"
                  disabled={!canWithdraw || submitting === "withdraw"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onMaxClick}
                  disabled={!canWithdraw || submitting === "withdraw"}
                >
                  Max
                </Button>
              </div>
            </label>
            <div className="text-sm text-muted-foreground">
              {peaksAmount != null
                ? `≈ ${formatEur(previewCents)}`
                : "Enter an amount above"}
            </div>
            <Button
              type="button"
              onClick={onWithdraw}
              disabled={
                !canWithdraw || peaksAmount == null || submitting === "withdraw"
              }
              className="sm:ml-auto"
            >
              {submitting === "withdraw" ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <ArrowDownToLineIcon className="size-4" aria-hidden />
              )}
              Withdraw to bank
            </Button>
          </div>
          {actionError ? (
            <p className="text-sm text-red-400">{actionError}</p>
          ) : null}
          {actionSuccess ? (
            <p className="text-sm text-emerald-400">{actionSuccess}</p>
          ) : null}
        </CardContent>
      </Card>

      <WithdrawalsHistory withdrawals={status.recentWithdrawals} />
      <EarningsHistory
        earnings={earnings}
        error={earningsError}
        peaksPerEuro={peaksPerEuro}
      />
    </div>
  );
}

function WithdrawalsHistory({
  withdrawals,
}: {
  withdrawals: PartnerWithdrawalDto[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent withdrawals</CardTitle>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between py-2"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {formatEur(w.amountCents)} ·{" "}
                    <span className="text-muted-foreground">
                      {formatPeaksCount(w.peaksDebited)} Peaks
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(w.createdAt)}
                    {w.failureReason ? ` · ${w.failureReason}` : ""}
                  </p>
                </div>
                <StatusBadgeChip badge={WITHDRAWAL_BADGES[w.status]} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EarningsHistory({
  earnings,
  error,
  peaksPerEuro,
}: {
  earnings: PartnerEarningsPageDto | null;
  error: string | null;
  peaksPerEuro: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent earnings</CardTitle>
        <CardDescription>
          Each line is a wave unlock that credited your withdrawable balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !earnings || earnings.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No earnings yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {earnings.items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between py-2"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">
                    +{formatPeaksCount(row.basePeaks)} Peaks{" "}
                    <span className="text-muted-foreground">
                      ({formatEur(peaksToCents(row.basePeaks, peaksPerEuro))})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.type === "buy_claim" ? "Buy & claim" : "Sponsor"} ·{" "}
                    {row.countryCode || "??"} · {formatDate(row.createdAt)}
                  </p>
                </div>
                <code className="font-mono text-[11px] text-muted-foreground">
                  {row.jobId.slice(0, 10)}…
                </code>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
