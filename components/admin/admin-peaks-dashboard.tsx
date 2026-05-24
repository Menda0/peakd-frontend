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
import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { englishCountryLabel } from "@/lib/countries";
import { isUndisclosedRegionId } from "@/lib/geo-undisclosed";
import type {
  AdminPeaksGeoRowDto,
  AdminPeaksSummaryDto,
  AdminPeaksTransactionDto,
} from "@/lib/admin-peaks";
import {
  fetchAdminPeaksByCountryAction,
  fetchAdminPeaksByRegionAction,
  fetchAdminPeaksSummaryAction,
  fetchAdminPeaksTransactionsAction,
} from "@/app/[userSub]/(social)/admin/peaks/actions";

function formatPeaks(n: number): string {
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

function shortUserId(id: string): string {
  const t = id.trim();
  if (t.length <= 20) return t;
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
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

export function AdminPeaksDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryFieldId = useId();
  const regionFieldId = useId();
  const initialCountry = searchParams.get("country")?.trim().toUpperCase() || "PT";
  const initialRegion = searchParams.get("region")?.trim() || null;

  const [summary, setSummary] = useState<AdminPeaksSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<AdminPeaksTransactionDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [byCountry, setByCountry] = useState<AdminPeaksGeoRowDto[]>([]);
  const [byRegion, setByRegion] = useState<AdminPeaksGeoRowDto[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>(initialCountry);
  const [regionId, setRegionId] = useState<string | null>(initialRegion);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geoFilter = {
    countryCode,
    regionId,
  };

  const syncUrl = useCallback(
    (country: string | null, region: string | null) => {
      const params = new URLSearchParams();
      if (country) params.set("country", country);
      if (region) params.set("region", region);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router],
  );

  const handleCountryChange = (cc: string | null) => {
    setCountryCode(cc);
    setRegionId(null);
    syncUrl(cc, null);
  };

  const handleRegionChange = (rid: string | null) => {
    if (rid && countryCode && isUndisclosedRegionId(rid, countryCode)) {
      return;
    }
    setRegionId(rid);
    syncUrl(countryCode, rid);
  };

  const loadDashboard = useCallback(async () => {
    if (!countryCode) {
      setSummary(null);
      setTransactions([]);
      setNextCursor(null);
      setByCountry([]);
      setByRegion([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [summaryRes, txRes, countryRes, regionRes] = await Promise.all([
      fetchAdminPeaksSummaryAction(geoFilter),
      fetchAdminPeaksTransactionsAction({ limit: 50, ...geoFilter }),
      fetchAdminPeaksByCountryAction(geoFilter),
      fetchAdminPeaksByRegionAction(countryCode, regionId),
    ]);
    setLoading(false);
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
    setSummary(summaryRes.data);
    setTransactions(txRes.data.items);
    setNextCursor(txRes.data.nextCursor);
    setByCountry(countryRes.data);
    setByRegion(regionRes.data);
  }, [countryCode, regionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, [loadDashboard]);

  const loadMoreTransactions = async () => {
    if (!nextCursor || loadingMore || !countryCode) return;
    setLoadingMore(true);
    const res = await fetchAdminPeaksTransactionsAction({
      limit: 50,
      cursor: nextCursor,
      ...geoFilter,
    });
    setLoadingMore(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTransactions((prev) => [...prev, ...res.data.items]);
    setNextCursor(res.data.nextCursor);
  };

  const filterLabel =
    regionId && byRegion[0]?.regionName
      ? `${byRegion[0].regionName} (${englishCountryLabel(countryCode) ?? countryCode})`
      : englishCountryLabel(countryCode) ?? countryCode;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Peaks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Commercial wave unlocks: partner payouts, community fees by session location, and
          circulating Peaks in user wallets. Community fees are not attributed to undisclosed
          locations.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Location filter</CardTitle>
          <CardDescription className="text-zinc-400">
            Filter transactions and community-fee breakdowns below. Wallet circulation is always
            global.
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

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Peaks in circulation"
          value={loading ? "…" : formatPeaks(summary?.circulatingPeaks ?? 0)}
          hint="Sum of all user wallet balances (not filtered)"
        />
        <SummaryCard
          label="Unlock transactions"
          value={loading ? "…" : formatPeaks(summary?.unlockTransactionCount ?? 0)}
          hint={countryCode ? `In ${filterLabel}` : undefined}
        />
        <SummaryCard
          label="Partner Peaks paid"
          value={loading ? "…" : formatPeaks(summary?.totalPartnerPeaks ?? 0)}
          hint="List price credited to partners"
        />
        <SummaryCard
          label="Community fees"
          value={loading ? "…" : formatPeaks(summary?.totalCommunityFeePeaks ?? 0)}
          hint="20% fee attributed to disclosed session regions only"
        />
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Transactions</CardTitle>
          <CardDescription className="text-zinc-400">
            Wave unlock purchases (buy & claim and sponsor)
            {countryCode ? ` · ${filterLabel}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!countryCode ? (
            <p className="text-sm text-zinc-500">Select a country to view transactions.</p>
          ) : loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions for this filter.</p>
          ) : (
            <>
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Location</th>
                    <th className="py-2 pr-3 text-right font-medium">Partner</th>
                    <th className="py-2 pr-3 text-right font-medium">Fee</th>
                    <th className="py-2 pr-3 text-right font-medium">Total</th>
                    <th className="py-2 pr-3 font-medium">Buyer</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const country =
                      englishCountryLabel(tx.countryCode) ?? tx.countryCode;
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
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-2.5 pr-3">{tx.type}</td>
                        <td className="py-2.5 pr-3">{location}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatPeaks(tx.basePeaks)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                          {formatPeaks(tx.communityFeePeaks)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-zinc-50">
                          {formatPeaks(tx.peaksCharged)}
                        </td>
                        <td
                          className="py-2.5 pr-3 font-mono text-xs text-zinc-500"
                          title={tx.buyerUserId}
                        >
                          {shortUserId(tx.buyerUserId)}
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
                    onClick={() => void loadMoreTransactions()}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Community fees by country</CardTitle>
          <CardDescription className="text-zinc-400">
            Fees from user purchases, attributed to disclosed session regions only.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!countryCode ? (
            <p className="text-sm text-zinc-500">Select a country.</p>
          ) : loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : byCountry.length === 0 ? (
            <p className="text-sm text-zinc-500">No data for this filter.</p>
          ) : (
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 text-right font-medium">Txns</th>
                  <th className="py-2 pr-4 text-right font-medium">Community fees</th>
                  <th className="py-2 pr-4 text-right font-medium">Partner paid</th>
                </tr>
              </thead>
              <tbody>
                {byCountry.map((row) => (
                  <tr key={row.countryCode} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-zinc-100">
                      {englishCountryLabel(row.countryCode) ?? row.countryCode}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
                      {row.transactionCount}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
                      {formatPeaks(row.communityFeePeaks)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
                      {formatPeaks(row.partnerPeaks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Community fees by region</CardTitle>
          <CardDescription className="text-zinc-400">
            Breakdown for {filterLabel}. Undisclosed regions are excluded.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!countryCode ? (
            <p className="text-sm text-zinc-500">Select a country.</p>
          ) : loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : byRegion.length === 0 ? (
            <p className="text-sm text-zinc-500">No unlocks for this filter yet.</p>
          ) : (
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="py-2 pr-4 font-medium">Region</th>
                  <th className="py-2 pr-4 text-right font-medium">Txns</th>
                  <th className="py-2 pr-4 text-right font-medium">Community fees</th>
                  <th className="py-2 pr-4 text-right font-medium">Partner paid</th>
                </tr>
              </thead>
              <tbody>
                {byRegion.map((row) => (
                  <tr key={row.regionId} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-zinc-100">
                      {row.regionName ?? row.regionId}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
                      {row.transactionCount}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
                      {formatPeaks(row.communityFeePeaks)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
                      {formatPeaks(row.partnerPeaks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
