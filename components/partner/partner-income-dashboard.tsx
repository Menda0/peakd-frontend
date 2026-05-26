"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  ImageOffIcon,
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
import { formatEur } from "@/lib/billing";
import {
  type PartnerEarningRowDto,
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

function buyerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

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

/**
 * Parses a user-entered EUR amount (e.g. "12", "12.50", "12,5") into cents,
 * returning null when the input is empty or not a valid positive amount.
 * Caps fractional digits at 2 to avoid sub-cent values like €0.005.
 */
function parseEurInputToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d+(?:\.\d{0,2})?$/.test(trimmed)) return null;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function PartnerIncomeDashboard({
  initialStatus,
  initialEarnings,
  userPathPrefix,
}: {
  initialStatus: PartnerPayoutsActionResult<PartnerPayoutsStatusDto>;
  initialEarnings: PartnerPayoutsActionResult<PartnerEarningsPageDto>;
  /** URL prefix for the signed-in user (e.g. "/auth0%7C123"), used to
   *  build links to the video details page from each earnings row. */
  userPathPrefix: string;
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

  const didMountRefreshRef = useRef(false);
  useEffect(() => {
    // Stripe sends the user to `return_url` (no query string) on success and
    // to `refresh_url` (`?refresh=1`) when the account link expires. In both
    // cases the cached onboarding state may still be `pending` because the
    // `account.updated` webhook hasn't arrived yet. If we mount and aren't
    // fully `enabled`, refresh once now and once shortly after — the server
    // action reconciles live against Stripe.
    if (typeof window === "undefined") return;
    if (didMountRefreshRef.current) return;
    if (status?.onboardingStatus === "enabled") return;
    didMountRefreshRef.current = true;
    const handles: number[] = [
      window.setTimeout(() => {
        void refreshStatus();
      }, 0),
      window.setTimeout(() => {
        void refreshStatus();
      }, 3000),
    ];
    return () => {
      for (const h of handles) window.clearTimeout(h);
    };
  }, [refreshStatus, status?.onboardingStatus]);

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

  const amountCents = useMemo(() => parseEurInputToCents(amountText), [
    amountText,
  ]);

  const onWithdraw = useCallback(async () => {
    if (!status || amountCents == null) return;
    setActionError(null);
    setActionSuccess(null);
    if (amountCents > status.withdrawableAmountCents) {
      setActionError("Amount exceeds available balance");
      return;
    }
    if (amountCents < status.minWithdrawalAmountCents) {
      setActionError(
        `Minimum withdrawal is ${formatEur(status.minWithdrawalAmountCents)}`,
      );
      return;
    }
    setSubmitting("withdraw");
    try {
      const res = await requestPartnerWithdrawalAction(amountCents);
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
  }, [amountCents, refreshEarnings, refreshStatus, status]);

  const onMaxClick = useCallback(() => {
    if (!status) return;
    setAmountText((status.withdrawableAmountCents / 100).toFixed(2));
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
  const canWithdraw =
    status.onboardingStatus === "enabled" &&
    status.withdrawableAmountCents >= status.minWithdrawalAmountCents;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Income</h1>
        <p className="text-sm text-muted-foreground">
          Cash out the money you earned from commercial wave unlocks straight to
          your bank account via Stripe.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Withdrawable balance</CardDescription>
            <CardTitle className="text-2xl">
              {formatEur(status.withdrawableAmountCents)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: {formatEur(status.minWithdrawalAmountCents)}
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
              <span className="mb-1 block text-muted-foreground">
                Amount (EUR)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">€</span>
                <Input
                  inputMode="decimal"
                  value={amountText}
                  onChange={(e) =>
                    setAmountText(e.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder={(status.minWithdrawalAmountCents / 100).toFixed(
                    2,
                  )}
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
            <Button
              type="button"
              onClick={onWithdraw}
              disabled={
                !canWithdraw || amountCents == null || submitting === "withdraw"
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
        userPathPrefix={userPathPrefix}
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
                  <p className="font-medium">{formatEur(w.amountCents)}</p>
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
  userPathPrefix,
}: {
  earnings: PartnerEarningsPageDto | null;
  error: string | null;
  userPathPrefix: string;
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
          <ul className="divide-y divide-border">
            {earnings.items.map((row) => (
              <EarningsRow
                key={row.id}
                row={row}
                userPathPrefix={userPathPrefix}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EarningsRow({
  row,
  userPathPrefix,
}: {
  row: PartnerEarningRowDto;
  userPathPrefix: string;
}) {
  const buyerName = row.buyer.displayName?.trim() || "Unknown user";
  const videoHref = `${userPathPrefix}/studio/${encodeURIComponent(row.jobId)}`;

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {row.buyer.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.buyer.avatarUrl}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
          />
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-1 ring-white/15"
            aria-hidden
          >
            {buyerInitials(buyerName)}
          </div>
        )}
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">
            {buyerName}{" "}
            <span className="text-muted-foreground">
              {row.type === "buy_claim" ? "bought & claimed" : "sponsored"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            +{formatEur(row.amountCents)} · {row.countryCode || "??"} ·{" "}
            {formatDate(row.createdAt)}
          </p>
        </div>
      </div>
      <EarningsRowPreviews
        videoHref={videoHref}
        thumbnails={row.previewThumbnailUrls}
        jobId={row.jobId}
      />
    </li>
  );
}

function EarningsRowPreviews({
  videoHref,
  thumbnails,
  jobId,
}: {
  videoHref: string;
  thumbnails: string[];
  jobId: string;
}) {
  const previews = thumbnails.slice(0, 3);
  const ariaLabel = `Open video ${jobId.slice(0, 10)}…`;

  if (previews.length === 0) {
    return (
      <Link
        href={videoHref}
        aria-label={ariaLabel}
        className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground transition hover:bg-muted/60"
      >
        <ImageOffIcon className="size-5" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {previews.map((url, i) => (
        <Link
          key={`${jobId}-${i}`}
          href={videoHref}
          aria-label={ariaLabel}
          className="block size-14 overflow-hidden rounded-md ring-1 ring-white/10 transition hover:ring-white/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        </Link>
      ))}
    </div>
  );
}
