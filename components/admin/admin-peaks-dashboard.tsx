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
import {
  DEFAULT_PEAKS_PER_EURO,
  formatPeaksEur,
  type AdminPeaksGeoRowDto,
  type AdminPeaksSummaryDto,
  type AdminPeaksTransactionDto,
} from "@/lib/admin-peaks";
import {
  fetchAdminPeaksByCountryAction,
  fetchAdminPeaksByRegionAction,
  fetchAdminPeaksSummaryAction,
  fetchAdminPeaksTransactionsAction,
} from "@/app/[userSub]/(social)/admin/peaks/actions";

type PeaksTab = "local" | "global";

function formatPeaks(n: number): string {
  return n.toLocaleString();
}

function PeaksAmount({
  peaks,
  peaksPerEuro,
  className,
}: {
  peaks: number;
  peaksPerEuro: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatPeaks(peaks)}{" "}
      <span className="text-zinc-500">({formatPeaksEur(peaks, peaksPerEuro)})</span>
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

function buyerDisplayLabel(tx: AdminPeaksTransactionDto): string {
  return tx.buyerDisplayName?.trim() || "Unknown user";
}

function buyerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function AdminPeaksBuyerCell({ tx }: { tx: AdminPeaksTransactionDto }) {
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
  subValue,
  hint,
}: {
  label: string;
  value: string;
  subValue?: string | null;
  hint?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardDescription className="text-zinc-400">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold text-zinc-50">{value}</CardTitle>
        {subValue ? (
          <p className="mt-1 text-sm font-medium text-zinc-400">{subValue}</p>
        ) : null}
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <p className="text-xs text-zinc-500">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function PeaksSummaryCard({
  label,
  peaks,
  peaksPerEuro,
  loading,
  hint,
}: {
  label: string;
  peaks: number | null | undefined;
  peaksPerEuro: number;
  loading: boolean;
  hint?: string;
}) {
  const amount = peaks ?? 0;
  return (
    <SummaryCard
      label={label}
      value={loading ? "…" : `${formatPeaks(amount)} Peaks`}
      subValue={loading ? undefined : formatPeaksEur(amount, peaksPerEuro)}
      hint={hint}
    />
  );
}

function PeaksCountryTable({
  rows,
  loading,
  emptyMessage,
  peaksPerEuro,
}: {
  rows: AdminPeaksGeoRowDto[];
  loading: boolean;
  emptyMessage: string;
  peaksPerEuro: number;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  return (
    <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-zinc-400">
          <th className="py-2 pr-4 font-medium">Country</th>
          <th className="py-2 pr-4 text-right font-medium">Txns</th>
          <th className="py-2 pr-4 text-right font-medium">Community fees</th>
          <th className="py-2 pr-4 text-right font-medium">Partner paid</th>
          <th className="py-2 pr-4 text-right font-medium">Total charged</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.countryCode} className="border-b border-white/5">
            <td className="py-2.5 pr-4 text-zinc-100">
              {englishCountryLabel(row.countryCode) ?? row.countryCode}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {row.transactionCount}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
              <PeaksAmount peaks={row.communityFeePeaks} peaksPerEuro={peaksPerEuro} />
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              <PeaksAmount peaks={row.partnerPeaks} peaksPerEuro={peaksPerEuro} />
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              <PeaksAmount peaks={row.totalPeaksCharged} peaksPerEuro={peaksPerEuro} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PeaksRegionTable({
  rows,
  loading,
  emptyMessage,
  showCountry,
  peaksPerEuro,
}: {
  rows: AdminPeaksGeoRowDto[];
  loading: boolean;
  emptyMessage: string;
  showCountry?: boolean;
  peaksPerEuro: number;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  return (
    <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-zinc-400">
          {showCountry ? <th className="py-2 pr-4 font-medium">Country</th> : null}
          <th className="py-2 pr-4 font-medium">Region</th>
          <th className="py-2 pr-4 text-right font-medium">Txns</th>
          <th className="py-2 pr-4 text-right font-medium">Community fees</th>
          <th className="py-2 pr-4 text-right font-medium">Partner paid</th>
          <th className="py-2 pr-4 text-right font-medium">Total charged</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.countryCode ?? ""}:${row.regionId}`}
            className="border-b border-white/5"
          >
            {showCountry ? (
              <td className="py-2.5 pr-4 text-zinc-300">
                {englishCountryLabel(row.countryCode) ?? row.countryCode ?? "—"}
              </td>
            ) : null}
            <td className="py-2.5 pr-4 text-zinc-100">
              {row.regionName ?? row.regionId}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
              {row.transactionCount}
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-50">
              <PeaksAmount peaks={row.communityFeePeaks} peaksPerEuro={peaksPerEuro} />
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              <PeaksAmount peaks={row.partnerPeaks} peaksPerEuro={peaksPerEuro} />
            </td>
            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">
              <PeaksAmount peaks={row.totalPeaksCharged} peaksPerEuro={peaksPerEuro} />
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
  peaksPerEuro,
}: {
  transactions: AdminPeaksTransactionDto[];
  loading: boolean;
  emptyMessage: string;
  loadingMore: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
  peaksPerEuro: number;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (transactions.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }
  return (
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
                  {formatDate(tx.createdAt)}
                </td>
                <td className="py-2.5 pr-3">{tx.type}</td>
                <td className="py-2.5 pr-3">{location}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  <PeaksAmount peaks={tx.basePeaks} peaksPerEuro={peaksPerEuro} />
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                  <PeaksAmount peaks={tx.communityFeePeaks} peaksPerEuro={peaksPerEuro} />
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-zinc-50">
                  <PeaksAmount peaks={tx.peaksCharged} peaksPerEuro={peaksPerEuro} />
                </td>
                <td className="py-2.5 pr-3">
                  <AdminPeaksBuyerCell tx={tx} />
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

export function AdminPeaksDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryFieldId = useId();
  const regionFieldId = useId();

  const initialTab: PeaksTab =
    searchParams.get("tab") === "global" ? "global" : "local";
  const initialCountry = searchParams.get("country")?.trim().toUpperCase() || "PT";
  const initialRegion = searchParams.get("region")?.trim() || null;

  const [tab, setTab] = useState<PeaksTab>(initialTab);
  const [countryCode, setCountryCode] = useState<string | null>(initialCountry);
  const [regionId, setRegionId] = useState<string | null>(initialRegion);

  const [localSummary, setLocalSummary] = useState<AdminPeaksSummaryDto | null>(null);
  const [localTransactions, setLocalTransactions] = useState<AdminPeaksTransactionDto[]>([]);
  const [localNextCursor, setLocalNextCursor] = useState<string | null>(null);
  const [localByCountry, setLocalByCountry] = useState<AdminPeaksGeoRowDto[]>([]);
  const [localByRegion, setLocalByRegion] = useState<AdminPeaksGeoRowDto[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localLoadingMore, setLocalLoadingMore] = useState(false);

  const [globalSummary, setGlobalSummary] = useState<AdminPeaksSummaryDto | null>(null);
  const [globalTransactions, setGlobalTransactions] = useState<AdminPeaksTransactionDto[]>([]);
  const [globalNextCursor, setGlobalNextCursor] = useState<string | null>(null);
  const [globalByCountry, setGlobalByCountry] = useState<AdminPeaksGeoRowDto[]>([]);
  const [globalByRegion, setGlobalByRegion] = useState<AdminPeaksGeoRowDto[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMore, setGlobalLoadingMore] = useState(false);
  const [globalLoaded, setGlobalLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const geoFilter = { countryCode, regionId };

  const syncUrl = useCallback(
    (nextTab: PeaksTab, country: string | null, region: string | null) => {
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
    const nextTab: PeaksTab = value === "global" ? "global" : "local";
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
      fetchAdminPeaksSummaryAction(geoFilter),
      fetchAdminPeaksTransactionsAction({ limit: 50, ...geoFilter }),
      fetchAdminPeaksByCountryAction({ countryCode }),
      fetchAdminPeaksByRegionAction(countryCode, regionId),
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
      fetchAdminPeaksSummaryAction(),
      fetchAdminPeaksTransactionsAction({ limit: 50 }),
      fetchAdminPeaksByCountryAction(),
      fetchAdminPeaksByRegionAction(),
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
    const res = await fetchAdminPeaksTransactionsAction({
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
    const res = await fetchAdminPeaksTransactionsAction({
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

  const circulationPeaks =
    localSummary?.circulatingPeaks ?? globalSummary?.circulatingPeaks;
  const peaksPerEuro =
    localSummary?.peaksPerEuro ??
    globalSummary?.peaksPerEuro ??
    DEFAULT_PEAKS_PER_EURO;
  const circulationLoading =
    circulationPeaks == null && (localLoading || globalLoading);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Peaks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Commercial wave unlocks: partner payouts, community fees by session location, and
          circulating Peaks in user wallets.
        </p>
      </div>

      <PeaksSummaryCard
        label="Peaks in circulation"
        peaks={circulationPeaks}
        peaksPerEuro={peaksPerEuro}
        loading={circulationLoading}
        hint={`Sum of all user wallet balances (global) · 1 EUR = ${peaksPerEuro} Peaks`}
      />

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
                View Peaks and community fees for a country and optional region.
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
            <p className="text-sm text-zinc-500">Select a country to view local Peaks.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Unlock transactions"
                  value={localLoading ? "…" : formatPeaks(localSummary?.unlockTransactionCount ?? 0)}
                  hint={filterLabel ? `In ${filterLabel}` : undefined}
                />
                <PeaksSummaryCard
                  label="Partner Peaks paid"
                  peaks={localSummary?.totalPartnerPeaks ?? 0}
                  peaksPerEuro={peaksPerEuro}
                  loading={localLoading}
                  hint={filterLabel ? `In ${filterLabel}` : undefined}
                />
                <PeaksSummaryCard
                  label="Community fees (country)"
                  peaks={localSummary?.countryCommunityFeePeaks ?? 0}
                  peaksPerEuro={peaksPerEuro}
                  loading={localLoading}
                  hint={countryLabel ?? countryCode}
                />
                <PeaksSummaryCard
                  label={regionId ? "Community fees (region)" : "Community fees (regions)"}
                  peaks={localSummary?.regionsCommunityFeePeaks ?? 0}
                  peaksPerEuro={peaksPerEuro}
                  loading={localLoading}
                  hint={
                    regionId && selectedRegionName
                      ? selectedRegionName
                      : `All disclosed regions in ${countryLabel ?? countryCode}`
                  }
                />
              </div>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Peaks by country</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Community fees and partner payouts for {countryLabel ?? countryCode}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <PeaksCountryTable
                    rows={localByCountry}
                    loading={localLoading}
                    emptyMessage="No unlocks for this country yet."
                    peaksPerEuro={peaksPerEuro}
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Peaks by region</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {filterLabel ?? countryLabel}. Undisclosed regions are excluded.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <PeaksRegionTable
                    rows={localByRegion}
                    loading={localLoading}
                    emptyMessage="No unlocks for this filter yet."
                    peaksPerEuro={peaksPerEuro}
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
                    peaksPerEuro={peaksPerEuro}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="global" className="mt-0 space-y-6 outline-none">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Unlock transactions"
              value={globalLoading ? "…" : formatPeaks(globalSummary?.unlockTransactionCount ?? 0)}
              hint="All countries"
            />
            <PeaksSummaryCard
              label="Partner Peaks paid"
              peaks={globalSummary?.totalPartnerPeaks ?? 0}
              peaksPerEuro={peaksPerEuro}
              loading={globalLoading}
              hint="All countries"
            />
            <PeaksSummaryCard
              label="Community fees"
              peaks={globalSummary?.totalCommunityFeePeaks ?? 0}
              peaksPerEuro={peaksPerEuro}
              loading={globalLoading}
              hint="Disclosed locations worldwide"
            />
            <PeaksSummaryCard
              label="Total Peaks charged"
              peaks={globalSummary?.totalPeaksCharged ?? 0}
              peaksPerEuro={peaksPerEuro}
              loading={globalLoading}
              hint="Unlock purchases globally"
            />
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Peaks by country</CardTitle>
              <CardDescription className="text-zinc-400">
                All countries ranked by community fees (disclosed locations only).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <PeaksCountryTable
                rows={globalByCountry}
                loading={globalLoading}
                emptyMessage="No unlock data yet."
                peaksPerEuro={peaksPerEuro}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-zinc-100">Peaks by region</CardTitle>
              <CardDescription className="text-zinc-400">
                All disclosed regions worldwide, grouped by country.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <PeaksRegionTable
                rows={globalByRegion}
                loading={globalLoading}
                emptyMessage="No unlock data yet."
                showCountry
                peaksPerEuro={peaksPerEuro}
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
                peaksPerEuro={peaksPerEuro}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
