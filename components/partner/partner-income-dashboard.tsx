"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  ImageOffIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/currencies";
import {
  type PartnerEarningRowDto,
  type PartnerEarningsPageDto,
  type PartnerEarningsTotalDto,
  type PartnerOnboardingStatus,
  type PartnerPayoutsStatusDto,
} from "@/lib/partner-payouts";
import {
  type PartnerPayoutsActionResult,
  getPartnerPayoutsStatusAction,
  listPartnerEarningsAction,
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
    icon: null,
  },
  pending: {
    label: "Onboarding incomplete",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: <Loader2Icon className="size-3.5 animate-spin" aria-hidden />,
  },
  enabled: {
    label: "Stripe connected",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: <CheckCircle2Icon className="size-3.5" aria-hidden />,
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

export function PartnerIncomeDashboard({
  initialStatus,
  initialEarnings,
  userPathPrefix,
}: {
  initialStatus: PartnerPayoutsActionResult<PartnerPayoutsStatusDto>;
  initialEarnings: PartnerPayoutsActionResult<PartnerEarningsPageDto>;
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
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
    setOnboardingBusy(true);
    try {
      const res = await startPartnerOnboardingAction();
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      window.location.href = res.data.url;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Onboarding failed");
    } finally {
      setOnboardingBusy(false);
    }
  }, []);

  if (!status) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold">Income</h1>
        <Card>
          <CardHeader>
            <CardTitle>We couldn&rsquo;t load your earnings</CardTitle>
            <CardDescription>
              {statusError ?? "Try again later."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onboardingBadge = ONBOARDING_BADGES[status.onboardingStatus];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Income</h1>
        <p className="text-sm text-muted-foreground">
          When a surfer unlocks your wave, Stripe routes your share directly to
          your connected account. There is no manual withdrawal step — Stripe
          pays out to your bank on its normal schedule.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Stripe Connect</CardDescription>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Payment account</span>
            <StatusBadgeChip badge={onboardingBadge} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.onboardingStatus === "enabled" ? (
            <p className="text-sm text-muted-foreground">
              Buyers pay through Peakd checkout; your earnings land in Stripe
              immediately after each sale. Manage payouts and tax forms in your
              Stripe Express dashboard.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect Stripe before selling commercial waves. Surfers cannot
              unlock your content until onboarding is complete.
            </p>
          )}
          {status.requirementsDue.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {status.requirementsDue.slice(0, 5).map((req) => (
                <li key={req}>{req}</li>
              ))}
              {status.requirementsDue.length > 5 ? (
                <li>&hellip;and {status.requirementsDue.length - 5} more</li>
              ) : null}
            </ul>
          ) : null}
          <Button
            type="button"
            variant={
              status.onboardingStatus === "enabled" ? "outline" : "default"
            }
            onClick={onConnect}
            disabled={onboardingBusy}
          >
            {onboardingBusy ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <ExternalLinkIcon className="size-4" aria-hidden />
            )}
            {status.onboardingStatus === "enabled"
              ? "Open Stripe dashboard"
              : status.onboardingStatus === "pending"
                ? "Continue onboarding"
                : "Connect Stripe"}
          </Button>
          {actionError ? (
            <p className="text-sm text-red-400">{actionError}</p>
          ) : null}
        </CardContent>
      </Card>

      <EarningsTotalsCard totals={status.earningsTotalsByCurrency} />

      <EarningsHistory
        earnings={earnings}
        error={earningsError}
        userPathPrefix={userPathPrefix}
        onRefresh={() => void refreshEarnings()}
      />
    </div>
  );
}

function EarningsTotalsCard({
  totals,
}: {
  totals: PartnerEarningsTotalDto[];
}) {
  if (totals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifetime earnings</CardTitle>
          <CardDescription>
            Completed unlock sales will appear here once buyers start paying for
            your waves.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lifetime earnings</CardTitle>
        <CardDescription>
          Your share from completed sales, paid directly via Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {totals.map((row) => (
            <li
              key={row.currency}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-muted-foreground">{row.currency}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(row.totalMinor, row.currency)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EarningsHistory({
  earnings,
  error,
  userPathPrefix,
  onRefresh,
}: {
  earnings: PartnerEarningsPageDto | null;
  error: string | null;
  userPathPrefix: string;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Recent sales</CardTitle>
          <CardDescription>
            Each line is a wave unlock paid to your Stripe account.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !earnings || earnings.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet.</p>
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
  const firstJobId = row.jobIds[0] ?? "";
  const videoHref = firstJobId
    ? `${userPathPrefix}/studio/${encodeURIComponent(firstJobId)}`
    : userPathPrefix;

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
              {row.intent === "buy_claim" ? "bought & claimed" : "sponsored"}
              {row.jobIds.length > 1 ? ` · ${row.jobIds.length} videos` : ""}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            +{formatMoney(row.amountMinor, row.currency)} ·{" "}
            {row.countryCode || "??"} · {formatDate(row.createdAt)}
          </p>
        </div>
      </div>
      <EarningsRowPreviews
        videoHref={videoHref}
        thumbnails={row.previewThumbnailUrls}
        jobId={firstJobId}
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
  const ariaLabel = jobId
    ? `Open video ${jobId.slice(0, 10)}…`
    : "Open video";

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
