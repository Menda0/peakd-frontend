"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountryPicker } from "@/components/pickers/country-picker";
import { englishCountryLabel } from "@/lib/countries";
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
  const searchParams = useSearchParams();
  const countryFieldId = useId();
  const initialCountry = searchParams.get("country")?.trim().toUpperCase() || "PT";

  const [summary, setSummary] = useState<AdminPeaksSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<AdminPeaksTransactionDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [byCountry, setByCountry] = useState<AdminPeaksGeoRowDto[]>([]);
  const [byRegion, setByRegion] = useState<AdminPeaksGeoRowDto[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>(initialCountry);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [summaryRes, txRes, countryRes] = await Promise.all([
      fetchAdminPeaksSummaryAction(),
      fetchAdminPeaksTransactionsAction({ limit: 50 }),
      fetchAdminPeaksByCountryAction(),
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
    setSummary(summaryRes.data);
    setTransactions(txRes.data.items);
    setNextCursor(txRes.data.nextCursor);
    setByCountry(countryRes.data);
  }, []);

  const loadRegions = useCallback(async () => {
    if (!countryCode) {
      setByRegion([]);
      return;
    }
    setLoadingRegions(true);
    const res = await fetchAdminPeaksByRegionAction(countryCode);
    setLoadingRegions(false);
    if (!res.ok) {
      setError(res.error);
      setByRegion([]);
      return;
    }
    setByRegion(res.data);
  }, [countryCode]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, [loadDashboard]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRegions();
    });
  }, [loadRegions]);

  const loadMoreTransactions = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetchAdminPeaksTransactionsAction({
      limit: 50,
      cursor: nextCursor,
    });
    setLoadingMore(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTransactions((prev) => [...prev, ...res.data.items]);
    setNextCursor(res.data.nextCursor);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Peaks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Commercial wave unlocks: partner payouts, community fees by session location, and
          circulating Peaks in user wallets.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Peaks in circulation"
          value={loading ? "…" : formatPeaks(summary?.circulatingPeaks ?? 0)}
          hint="Sum of all user wallet balances"
        />
        <SummaryCard
          label="Unlock transactions"
          value={loading ? "…" : formatPeaks(summary?.unlockTransactionCount ?? 0)}
        />
        <SummaryCard
          label="Partner Peaks paid"
          value={loading ? "…" : formatPeaks(summary?.totalPartnerPeaks ?? 0)}
          hint="List price credited to partners"
        />
        <SummaryCard
          label="Community fees"
          value={loading ? "…" : formatPeaks(summary?.totalCommunityFeePeaks ?? 0)}
          hint="20% fee attributed to session country/region"
        />
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Transactions</CardTitle>
          <CardDescription className="text-zinc-400">
            Wave unlock purchases (buy & claim and sponsor).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions yet.</p>
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
                    const location = tx.regionName
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
            Fees from user purchases, attributed to the surf session country.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : byCountry.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
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
            Breakdown for the selected country (session region where the video was filmed).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CountryPicker
            id={countryFieldId}
            label="Country"
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
          />
          <div className="overflow-x-auto">
            {loadingRegions ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : !countryCode ? (
              <p className="text-sm text-zinc-500">Select a country.</p>
            ) : byRegion.length === 0 ? (
              <p className="text-sm text-zinc-500">No unlocks for this country yet.</p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
