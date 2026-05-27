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
import { formatMoney } from "@/lib/currencies";
import type {
  AdminFinanceCurrencyRowDto,
  AdminFinanceOverviewDto,
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
  feesMinor: number,
  revenueMinor: number,
): string {
  if (revenueMinor <= 0) return "n/a";
  const pct = (feesMinor / revenueMinor) * 100;
  return `${pct.toFixed(2)}%`;
}

function CurrencyRowCard({ row }: { row: AdminFinanceCurrencyRowDto }) {
  const fmt = (minor: number) => formatMoney(minor, row.currency);

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-50">
          {row.currency}
        </h2>
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {row.ledger.totalOrders.toLocaleString()} orders
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FinanceCard
          label={`Stripe available (${row.currency})`}
          value={fmt(row.stripe.availableMinor)}
          hint="Platform commission held after destination charges."
          tone="good"
        />
        <FinanceCard
          label={`Stripe pending (${row.currency})`}
          value={fmt(row.stripe.pendingMinor)}
          hint="Charges that have not yet cleared."
        />
        <FinanceCard
          label="Net platform margin"
          value={fmt(row.derived.netPlatformMarginMinor)}
          hint="Commission earned minus Stripe fees."
          tone={row.derived.netPlatformMarginMinor >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceCard
          label="Total revenue"
          value={fmt(row.ledger.totalRevenueMinor)}
          hint="Sum of buyer payments for completed orders."
        />
        <FinanceCard
          label="Stripe fees paid"
          value={fmt(row.ledger.totalStripeFeesMinor)}
          hint={`Effective ${effectiveStripeFeePercent(row.ledger.totalStripeFeesMinor, row.ledger.totalRevenueMinor)}.`}
          tone="bad"
        />
        <FinanceCard
          label="Transferred to partners"
          value={fmt(row.ledger.totalPartnerPaidOutMinor)}
          hint="Routed to Connect accounts at checkout."
        />
        <FinanceCard
          label="Platform commission earned"
          value={fmt(row.ledger.totalPlatformCommissionMinor)}
          hint="20% surcharge on partner prices."
        />
      </div>
    </section>
  );
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Finance
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Per-currency platform snapshot: Stripe balance, lifetime revenue,
            processing fees, partner liability, payouts, and commission.
            Platform commission is {overview.platformCommissionPercent}% on
            top of every partner sale.
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

      {overview.stripeError ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Stripe balance unavailable: {overview.stripeError}. Ledger figures
          below are still accurate.
        </p>
      ) : null}

      <p className="text-xs text-zinc-500">
        Snapshot taken {new Date(overview.fetchedAt).toLocaleTimeString()} ·
        Stripe balance cached up to 60s.
      </p>

      {overview.rows.length === 0 ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-3 text-sm text-zinc-400">
          No completed orders or partner balances yet.
        </p>
      ) : (
        <div className="space-y-6">
          {overview.rows.map((row) => (
            <CurrencyRowCard key={row.currency} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
