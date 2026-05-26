"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatEurCents,
  type AdminFinanceOverviewDto,
} from "@/lib/admin-finance";
import { fetchAdminFinanceOverviewAction } from "@/app/[userSub]/(social)/admin/finance/actions";

function FinanceCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-red-300"
        : "text-zinc-50";
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardDescription className="text-zinc-400">{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold ${valueClass}`}>
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <p className="text-xs text-zinc-500">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function effectiveStripeFeePercent(
  feesCents: number,
  revenueCents: number,
): string {
  if (revenueCents <= 0) return "n/a";
  const pct = (feesCents / revenueCents) * 100;
  return `${pct.toFixed(2)}%`;
}

export function AdminFinanceDashboard() {
  const [overview, setOverview] = useState<AdminFinanceOverviewDto | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminFinanceOverviewAction();
    if (result.ok) {
      setOverview(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (loading && !overview) {
    return <p className="text-sm text-zinc-500">Loading finance overview…</p>;
  }

  if (!overview) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error ?? "Failed to load finance overview."}
        </p>
        <Button onClick={() => void onRefresh()} disabled={refreshing}>
          {refreshing ? "Retrying…" : "Retry"}
        </Button>
      </div>
    );
  }

  const { stripe, ledger, derived } = overview;
  const liabilityDeltaNegative = derived.liabilityVsBalanceDeltaCents < 0;
  const stripeFeeNoteVisible = ledger.totalPurchases > ledger.purchasesWithFeeData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Finance
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live snapshot of the platform&apos;s Stripe balance, lifetime revenue, processing
            fees, partner liability, payouts, and platform retention. All amounts are in EUR
            unless labeled otherwise. The Stripe balance is cached for 60 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void onRefresh()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {stripe.error ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Stripe balance unavailable: {stripe.error}. Other figures below are still
          accurate.
        </p>
      ) : null}

      {liabilityDeltaNegative ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Warning: Stripe EUR available balance ({formatEurCents(stripe.availableEurCents)})
          is below total partner liability (
          {formatEurCents(ledger.totalPartnerLiabilityCents)}). A coordinated
          withdrawal could fail with &quot;insufficient available funds&quot;. Shortfall:{" "}
          {formatEurCents(-derived.liabilityVsBalanceDeltaCents)}.
        </p>
      ) : null}

      {stripe.nonEurCurrencies.length > 0 ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Non-EUR Stripe balances detected ({stripe.nonEurCurrencies.join(", ")}). Partner
          transfers use EUR exclusively, so funds in other currencies cannot be used.
        </p>
      ) : null}

      {stripeFeeNoteVisible ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
          {ledger.totalPurchases - ledger.purchasesWithFeeData} of {ledger.totalPurchases}{" "}
          historical purchases pre-date Stripe-fee capture; the &quot;Stripe fees paid&quot;
          figure is a lower bound until those rows are backfilled.
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Stripe platform balance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FinanceCard
            label="Available (EUR)"
            value={formatEurCents(stripe.availableEurCents)}
            hint="Funds ready to fund partner withdrawals right now."
            tone={liabilityDeltaNegative ? "bad" : "good"}
          />
          <FinanceCard
            label="Pending (EUR)"
            value={formatEurCents(stripe.pendingEurCents)}
            hint="Charges that have not yet cleared into the available balance."
          />
          <FinanceCard
            label="Liability vs balance"
            value={formatEurCents(derived.liabilityVsBalanceDeltaCents)}
            hint="Available − total unwithdrawn partner earnings. Negative = shortfall."
            tone={liabilityDeltaNegative ? "bad" : "good"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Revenue & costs (lifetime)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinanceCard
            label="Total revenue"
            value={formatEurCents(ledger.totalRevenueCents)}
            hint={`${ledger.totalPurchases.toLocaleString()} Peak-pack purchases.`}
          />
          <FinanceCard
            label="Stripe fees paid"
            value={formatEurCents(ledger.totalStripeFeesCents)}
            hint={`Effective rate ${effectiveStripeFeePercent(ledger.totalStripeFeesCents, ledger.totalRevenueCents)}.`}
            tone="bad"
          />
          <FinanceCard
            label="Paid out to partners"
            value={formatEurCents(ledger.totalPartnerPaidOutCents)}
            hint="Sum of completed Stripe transfers to connected accounts."
            tone="bad"
          />
          <FinanceCard
            label="Net margin"
            value={formatEurCents(derived.netPlatformMarginCents)}
            hint="Revenue − Stripe fees − paid out − unwithdrawn liability."
            tone={derived.netPlatformMarginCents >= 0 ? "good" : "bad"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Liability & retention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FinanceCard
            label="Partner liability (unwithdrawn)"
            value={formatEurCents(ledger.totalPartnerLiabilityCents)}
            hint="Money owed to partners on UserProfile.partnerEarningsCents. Withdrawable on demand."
            tone="bad"
          />
          <FinanceCard
            label="Platform retention (lifetime)"
            value={formatEurCents(ledger.totalPlatformRetentionEurCents)}
            hint={`${ledger.totalPlatformRetentionPeaks.toLocaleString()} Peaks across disclosed regions. Funds community awards at admin discretion.`}
          />
          <FinanceCard
            label="Snapshot taken"
            value={new Date(overview.fetchedAt).toLocaleTimeString()}
            hint={`1 EUR = ${overview.peaksPerEuro} Peaks · Stripe balance cached up to 60s.`}
          />
        </div>
      </section>
    </div>
  );
}
