"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { englishCountryLabel } from "@/lib/countries";
import { isUndisclosedRegionId } from "@/lib/geo-undisclosed";
import { formatMoney } from "@/lib/currencies";
import type {
  AdminSalesCurrencyTotalDto,
  AdminSalesGeoRowDto,
  AdminSalesSummaryDto,
  AdminSalesTransactionDto,
} from "@/lib/admin-sales";
import {
  fetchAdminSalesByCountryAction,
  fetchAdminSalesByRegionAction,
  fetchAdminSalesSummaryAction,
  fetchAdminSalesTransactionsAction,
} from "@/app/[userSub]/(social)/admin/sales/actions";

type SalesTab = "local" | "global";

function formatCount(n: number): string {
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function buyerDisplayLabel(tx: AdminSalesTransactionDto): string {
  return tx.buyerDisplayName?.trim() || "Unknown user";
}

function buyerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function AdminSalesBuyerCell({ tx }: { tx: AdminSalesTransactionDto }) {
  const name = buyerDisplayLabel(tx);
  const sub = tx.buyerUserId.trim();
  return (
    <div className="flex min-w-[10rem] max-w-[14rem] items-center gap-2.5">
      {tx.buyerAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tx.buyerAvatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
        />
      ) : (
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-1 ring-white/15"
          aria-hidden
        >
          {buyerInitials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
        <p className="truncate font-mono text-[10px] leading-tight text-zinc-500" title={sub}>
          {sub}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardDescription className="text-zinc-400">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold text-zinc-50">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <p className="text-xs text-zinc-500">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function CurrencyTotalsTable({
  rows,
  loading,
  emptyMessage,
}: {
  rows: AdminSalesCurrencyTotalDto[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  return (
    <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-zinc-400">
          <th className="py-2 pr-4 font-medium">Currency</th>
          <th className="py-2 pr-4 text-right font-medium">Txns</th>
          <th className="py-2 pr-4 text-right font-medium">Partner</th>
          <th className="py-2 pr-4 text-right font-medium">Commission</th>
          <th className="py-2 pr-4 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.currency} className="border-b border-white/5">
            <td className="py-2.5 pr-4 text-zinc-100">{row.currency}</td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {row.transactionCount}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              {formatMoney(row.partnerSubtotalMinor, row.currency)}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
              {formatMoney(row.platformCommissionMinor, row.currency)}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {formatMoney(row.totalAmountMinor, row.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GeoTable({
  rows,
  loading,
  emptyMessage,
  showCountry,
  showRegion,
}: {
  rows: AdminSalesGeoRowDto[];
  loading: boolean;
  emptyMessage: string;
  showCountry?: boolean;
  showRegion?: boolean;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  return (
    <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-zinc-400">
          {showCountry ? <th className="py-2 pr-4 font-medium">Country</th> : null}
          {showRegion ? <th className="py-2 pr-4 font-medium">Region</th> : null}
          <th className="py-2 pr-4 font-medium">Currency</th>
          <th className="py-2 pr-4 text-right font-medium">Txns</th>
          <th className="py-2 pr-4 text-right font-medium">Partner</th>
          <th className="py-2 pr-4 text-right font-medium">Commission</th>
          <th className="py-2 pr-4 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={`${row.countryCode ?? ""}:${row.regionId ?? ""}:${row.currency}:${idx}`}
            className="border-b border-white/5"
          >
            {showCountry ? (
              <td className="py-2.5 pr-4 text-zinc-300">
                {englishCountryLabel(row.countryCode) ?? row.countryCode ?? "—"}
              </td>
            ) : null}
            {showRegion ? (
              <td className="py-2.5 pr-4 text-zinc-100">
                {row.regionName ?? row.regionId ?? "—"}
              </td>
            ) : null}
            <td className="py-2.5 pr-4 text-zinc-300">{row.currency}</td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {row.transactionCount}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              {formatMoney(row.partnerSubtotalMinor, row.currency)}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
              {formatMoney(row.platformCommissionMinor, row.currency)}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {formatMoney(row.totalAmountMinor, row.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TransactionsTable({
  transactions,
  loading,
  emptyMessage,
  loadingMore,
  nextCursor,
  onLoadMore,
}: {
  transactions: AdminSalesTransactionDto[];
  loading: boolean;
  emptyMessage: string;
  loadingMore: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (transactions.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }
  return (
    <>
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-zinc-400">
            <th className="py-2 pr-3 font-medium">When</th>
            <th className="py-2 pr-3 font-medium">Intent</th>
            <th className="py-2 pr-3 font-medium">Location</th>
            <th className="py-2 pr-3 text-right font-medium">Partner</th>
            <th className="py-2 pr-3 text-right font-medium">Commission</th>
            <th className="py-2 pr-3 text-right font-medium">Total</th>
            <th className="py-2 pr-3 font-medium">Buyer</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const country = englishCountryLabel(tx.countryCode) ?? tx.countryCode;
            const isUndisclosed =
              tx.regionName === "Undisclosed" ||
              (tx.countryCode &&
                tx.regionId &&
                isUndisclosedRegionId(tx.regionId, tx.countryCode));
            const location = isUndisclosed
              ? `Undisclosed (${country})`
              : tx.regionName
                ? `${tx.regionName} (${country})`
                : country || "—";
            return (
              <tr key={tx.id} className="border-b border-white/5 text-zinc-200">
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-400">
                  {formatDate(tx.completedAt)}
                </td>
                <td className="py-2.5 pr-3">{tx.intent}</td>
                <td className="py-2.5 pr-3">{location}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatMoney(tx.partnerSubtotalMinor, tx.currency)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                  {formatMoney(tx.platformCommissionMinor, tx.currency)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-zinc-50">
                  {formatMoney(tx.totalAmountMinor, tx.currency)}
                </td>
                <td className="py-2.5 pr-3">
                  <AdminSalesBuyerCell tx={tx} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function AdminSalesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryFieldId = useId();
  const regionFieldId = useId();

  const initialTab: SalesTab =
    searchParams.get("tab") === "global" ? "global" : "local";
  const initialCountry = searchParams.get("country")?.trim().toUpperCase() || "PT";
  const initialRegion = searchParams.get("region")?.trim() || null;

  const [tab, setTab] = useState<SalesTab>(initialTab);
  const [countryCode, setCountryCode] = useState<string | null>(initialCountry);
  const [regionId, setRegionId] = useState<string | null>(initialRegion);

  const [localSummary, setLocalSummary] = useState<AdminSalesSummaryDto | null>(null);
  const [localTransactions, setLocalTransactions] = useState<AdminSalesTransactionDto[]>([]);
  const [localNextCursor, setLocalNextCursor] = useState<string | null>(null);
  const [localByCountry, setLocalByCountry] = useState<AdminSalesGeoRowDto[]>([]);
  const [localByRegion, setLocalByRegion] = useState<AdminSalesGeoRowDto[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localLoadingMore, setLocalLoadingMore] = useState(false);

  const [globalSummary, setGlobalSummary] = useState<AdminSalesSummaryDto | null>(null);
  const [globalTransactions, setGlobalTransactions] = useState<AdminSalesTransactionDto[]>([]);
  const [globalNextCursor, setGlobalNextCursor] = useState<string | null>(null);
  const [globalByCountry, setGlobalByCountry] = useState<AdminSalesGeoRowDto[]>([]);
  const [globalByRegion, setGlobalByRegion] = useState<AdminSalesGeoRowDto[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMore, setGlobalLoadingMore] = useState(false);
  const [globalLoaded, setGlobalLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const geoFilter = { countryCode, regionId };

  const syncUrl = useCallback(
    (nextTab: SalesTab, country: string | null, region: string | null) => {
      const params = new URLSearchParams();
      if (nextTab === "global") params.set("tab", "global");
      if (country) params.set("country", country);
      if (region) params.set("region", region);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router],
  );

  const handleTabChange = (value: string) => {
    const nextTab: SalesTab = value === "global" ? "global" : "local";
    setTab(nextTab);
    syncUrl(nextTab, countryCode, regionId);
  };

  const handleCountryChange = (cc: string | null) => {
    setCountryCode(cc);
    setRegionId(null);
    syncUrl(tab, cc, null);
  };

  const handleRegionChange = (rid: string | null) => {
    if (rid && countryCode && isUndisclosedRegionId(rid, countryCode)) {
      return;
    }
    setRegionId(rid);
    syncUrl(tab, countryCode, rid);
  };

  const loadLocal = useCallback(async () => {
    if (!countryCode) {
      setLocalSummary(null);
      setLocalTransactions([]);
      setLocalNextCursor(null);
      setLocalByCountry([]);
      setLocalByRegion([]);
      setLocalLoading(false);
      return;
    }
    setLocalLoading(true);
    setError(null);
    const [summaryRes, txRes, countryRes, regionRes] = await Promise.all([
      fetchAdminSalesSummaryAction(geoFilter),
      fetchAdminSalesTransactionsAction({ limit: 50, ...geoFilter }),
      fetchAdminSalesByCountryAction({ countryCode }),
      fetchAdminSalesByRegionAction(countryCode, regionId),
    ]);
    setLocalLoading(false);
    if (!summaryRes.ok) {
      setError(summaryRes.error);
      return;
    }
    if (!txRes.ok) {
      setError(txRes.error);
      return;
    }
    if (!countryRes.ok) {
      setError(countryRes.error);
      return;
    }
    if (!regionRes.ok) {
      setError(regionRes.error);
      return;
    }
    setLocalSummary(summaryRes.data);
    setLocalTransactions(txRes.data.items);
    setLocalNextCursor(txRes.data.nextCursor);
    setLocalByCountry(countryRes.data);
    setLocalByRegion(regionRes.data);
  }, [countryCode, regionId]);

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    setError(null);
    const [summaryRes, txRes, countryRes, regionRes] = await Promise.all([
      fetchAdminSalesSummaryAction(),
      fetchAdminSalesTransactionsAction({ limit: 50 }),
      fetchAdminSalesByCountryAction(),
      fetchAdminSalesByRegionAction(),
    ]);
    setGlobalLoading(false);
    setGlobalLoaded(true);
    if (!summaryRes.ok) {
      setError(summaryRes.error);
      return;
    }
    if (!txRes.ok) {
      setError(txRes.error);
      return;
    }
    if (!countryRes.ok) {
      setError(countryRes.error);
      return;
    }
    if (!regionRes.ok) {
      setError(regionRes.error);
      return;
    }
    setGlobalSummary(summaryRes.data);
    setGlobalTransactions(txRes.data.items);
    setGlobalNextCursor(txRes.data.nextCursor);
    setGlobalByCountry(countryRes.data);
    setGlobalByRegion(regionRes.data);
  }, []);

  useEffect(() => {
    if (tab !== "local") return;
    queueMicrotask(() => {
      void loadLocal();
    });
  }, [tab, loadLocal]);

  useEffect(() => {
    if (tab !== "global") return;
    if (globalLoaded) return;
    queueMicrotask(() => {
      void loadGlobal();
    });
  }, [tab, globalLoaded, loadGlobal]);

  const loadMoreLocalTransactions = async () => {
    if (!localNextCursor || localLoadingMore || !countryCode) return;
    setLocalLoadingMore(true);
    const res = await fetchAdminSalesTransactionsAction({
      limit: 50,
      cursor: localNextCursor,
      ...geoFilter,
    });
    setLocalLoadingMore(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setLocalTransactions((prev) => [...prev, ...res.data.items]);
    setLocalNextCursor(res.data.nextCursor);
  };

  const loadMoreGlobalTransactions = async () => {
    if (!globalNextCursor || globalLoadingMore) return;
    setGlobalLoadingMore(true);
    const res = await fetchAdminSalesTransactionsAction({
      limit: 50,
      cursor: globalNextCursor,
    });
    setGlobalLoadingMore(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setGlobalTransactions((prev) => [...prev, ...res.data.items]);
    setGlobalNextCursor(res.data.nextCursor);
  };

  const countryLabel = countryCode
    ? (englishCountryLabel(countryCode) ?? countryCode)
    : null;
  const selectedRegionName =
    regionId != null
      ? (localByRegion.find((r) => r.regionId === regionId)?.regionName ??
        localByRegion[0]?.regionName ??
        null)
      : null;
  const filterLabel =
    selectedRegionName && countryLabel
      ? `${selectedRegionName} (${countryLabel})`
      : countryLabel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Sales</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Commercial wave unlocks: per-currency partner payouts and platform commission by
          session location.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="mb-2 w-full sm:w-auto">
          <TabsTrigger value="local" className="min-w-[7rem]">
            Local
          </TabsTrigger>
          <TabsTrigger value="global" className="min-w-[7rem]">
            Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="mt-0 space-y-6 outline-none">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-zinc-100">Location</CardTitle>
              <CardDescription className="text-zinc-400">
                View commission for a country and optional region, broken down per currency.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <CountryPicker
                id={countryFieldId}
                label="Country"
                countryCode={countryCode}
                onCountryCodeChange={handleCountryChange}
              />
              <RegionPicker
                id={regionFieldId}
                label="Region"
                countryCode={countryCode}
                regionId={regionId}
                onRegionIdChange={handleRegionChange}
                allowCreate={false}
                verifiedOnly={false}
                includeUndisclosedOption={false}
              />
            </CardContent>
          </Card>

          {!countryCode ? (
            <p className="text-sm text-zinc-500">
              Select a country to view local sales.
            </p>
          ) : (
            <>
              <SummaryCard
                label="Unlock transactions"
                value={
                  localLoading
                    ? "…"
                    : formatCount(localSummary?.unlockTransactionCount ?? 0)
                }
                hint={filterLabel ? `In ${filterLabel}` : undefined}
              />

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Per-currency totals</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Partner and platform commission for {filterLabel ?? countryLabel}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <CurrencyTotalsTable
                    rows={localSummary?.byCurrency ?? []}
                    loading={localLoading}
                    emptyMessage="No sales for this filter yet."
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Commission by country/currency</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {countryLabel ?? countryCode}, all currencies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <GeoTable
                    rows={localByCountry}
                    loading={localLoading}
                    emptyMessage="No unlocks for this country yet."
                    showCountry
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Commission by region/currency</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {filterLabel ?? countryLabel}. Undisclosed regions are excluded.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <GeoTable
                    rows={localByRegion}
                    loading={localLoading}
                    emptyMessage="No unlocks for this filter yet."
                    showRegion
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Transactions</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Wave unlock purchases in {filterLabel ?? countryLabel}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <TransactionsTable
                    transactions={localTransactions}
                    loading={localLoading}
                    emptyMessage="No transactions for this filter."
                    loadingMore={localLoadingMore}
                    nextCursor={localNextCursor}
                    onLoadMore={() => void loadMoreLocalTransactions()}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="global" className="mt-0 space-y-6 outline-none">
          <SummaryCard
            label="Unlock transactions"
            value={
              globalLoading
                ? "…"
                : formatCount(globalSummary?.unlockTransactionCount ?? 0)
            }
            hint="All countries"
          />

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Per-currency totals</CardTitle>
              <CardDescription className="text-zinc-400">
                Lifetime partner subtotals and platform commission, by currency.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <CurrencyTotalsTable
                rows={globalSummary?.byCurrency ?? []}
                loading={globalLoading}
                emptyMessage="No sales yet."
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Commission by country/currency</CardTitle>
              <CardDescription className="text-zinc-400">
                All countries, ranked by total amount charged.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <GeoTable
                rows={globalByCountry}
                loading={globalLoading}
                emptyMessage="No unlock data yet."
                showCountry
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Commission by region/currency</CardTitle>
              <CardDescription className="text-zinc-400">
                All disclosed regions worldwide, grouped by country.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <GeoTable
                rows={globalByRegion}
                loading={globalLoading}
                emptyMessage="No unlock data yet."
                showCountry
                showRegion
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Transactions</CardTitle>
              <CardDescription className="text-zinc-400">
                Latest wave unlock purchases worldwide.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <TransactionsTable
                transactions={globalTransactions}
                loading={globalLoading}
                emptyMessage="No transactions yet."
                loadingMore={globalLoadingMore}
                nextCursor={globalNextCursor}
                onLoadMore={() => void loadMoreGlobalTransactions()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
