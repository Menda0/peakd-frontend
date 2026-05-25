"use client";

import { Loader2Icon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getApiBase } from "@/lib/api";
import { englishCountryLabel } from "@/lib/countries";
import {
  buildGeoSearchLabel,
  countryOptionToSelection,
  fetchGeoSuggest,
  filterCountrySuggestions,
  type GeoSearchSelection,
} from "@/lib/feed-search";
import { isGeoVerified, sortGeoOptions } from "@/lib/geo-picker-utils";
import { cn } from "@/lib/utils";
import type { FeedTabId } from "./feed-tabs";

export type AllTabFilter = { geo: GeoSearchSelection | null };
export type CountryTabFilter = {
  regionIds: string[];
  spotIds: string[];
};
export type RegionTabFilter = { spotIds: string[] };

export type FeedFiltersState = {
  all: AllTabFilter;
  country: CountryTabFilter;
  region: RegionTabFilter;
};

export const EMPTY_FEED_FILTERS: FeedFiltersState = {
  all: { geo: null },
  country: { regionIds: [], spotIds: [] },
  region: { spotIds: [] },
};

export function isFilterActive(
  tabId: FeedTabId,
  filters: FeedFiltersState,
): boolean {
  if (tabId === "all") return filters.all.geo != null;
  if (tabId === "country") {
    return (
      filters.country.regionIds.length > 0 ||
      filters.country.spotIds.length > 0
    );
  }
  return filters.region.spotIds.length > 0;
}

type RegionOption = { regionId: string; name: string; verified: boolean };
type SpotOption = { spotId: string; name: string; verified: boolean };

function parseRegionList(data: unknown): RegionOption[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (r): r is Record<string, unknown> =>
        r != null && typeof r === "object" && typeof r.regionId === "string",
    )
    .map((r) => ({
      regionId: String(r.regionId),
      name: typeof r.name === "string" ? r.name : String(r.regionId),
      verified: isGeoVerified(r.verified),
    }));
}

function parseSpotList(data: unknown): SpotOption[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (s): s is Record<string, unknown> =>
        s != null && typeof s === "object" && typeof s.spotId === "string",
    )
    .map((s) => ({
      spotId: String(s.spotId),
      name: typeof s.name === "string" ? s.name : String(s.spotId),
      verified: isGeoVerified(s.verified),
    }));
}

function CheckboxList({
  items,
  value,
  onToggle,
}: {
  items: { id: string; name: string }[];
  value: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-md border border-border bg-muted/30 p-1.5">
      {items.map((item) => {
        const checked = value.has(item.id);
        const id = `chk-${item.id}`;
        return (
          <Label
            key={item.id}
            htmlFor={id}
            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm font-normal hover:bg-accent"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={() => onToggle(item.id)}
            />
            <span className="truncate">{item.name}</span>
          </Label>
        );
      })}
    </div>
  );
}

function StatusBlock({
  loading,
  error,
  emptyMessage,
  isEmpty,
  children,
}: {
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
      </div>
    );
  }
  if (error) return <p className="text-xs text-red-400">{error}</p>;
  if (isEmpty) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }
  return <>{children}</>;
}

function RegionMultiSelect({
  countryCode,
  value,
  onValueChange,
}: {
  countryCode: string;
  value: string[];
  onValueChange: (next: string[]) => void;
}) {
  const [items, setItems] = useState<RegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const base = getApiBase();
    const params = new URLSearchParams({ countryCode, verifiedOnly: "true" });
    fetch(`${base}/studio/regions?${params.toString()}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text().catch(() => res.statusText));
        }
        return res.json() as Promise<unknown>;
      })
      .then((raw) => {
        if (cancelled) return;
        setItems(sortGeoOptions(parseRegionList(raw)));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load regions");
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = useCallback(
    (regionId: string) => {
      const next = new Set(selected);
      if (next.has(regionId)) next.delete(regionId);
      else next.add(regionId);
      onValueChange(Array.from(next));
    },
    [selected, onValueChange],
  );

  return (
    <StatusBlock
      loading={loading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No regions in this country yet."
    >
      <CheckboxList
        items={items.map((r) => ({ id: r.regionId, name: r.name }))}
        value={selected}
        onToggle={toggle}
      />
    </StatusBlock>
  );
}

function SpotMultiSelect({
  regionIds,
  value,
  onValueChange,
  emptyMessage,
}: {
  regionIds: string[];
  value: string[];
  onValueChange: (next: string[]) => void;
  emptyMessage: string;
}) {
  const [items, setItems] = useState<SpotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionIdsKey = useMemo(
    () => [...regionIds].sort().join(","),
    [regionIds],
  );

  useEffect(() => {
    if (regionIds.length === 0) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const base = getApiBase();
    Promise.all(
      regionIds.map(async (regionId) => {
        const params = new URLSearchParams({ regionId, verifiedOnly: "true" });
        const res = await fetch(`${base}/studio/spots?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text().catch(() => res.statusText));
        }
        return parseSpotList(await res.json());
      }),
    )
      .then((lists) => {
        if (cancelled) return;
        const merged = new Map<string, SpotOption>();
        for (const list of lists) {
          for (const s of list) {
            if (!merged.has(s.spotId)) merged.set(s.spotId, s);
          }
        }
        setItems(sortGeoOptions(Array.from(merged.values())));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load spots");
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // regionIdsKey captures order-independent identity of regionIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionIdsKey]);

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = useCallback(
    (spotId: string) => {
      const next = new Set(selected);
      if (next.has(spotId)) next.delete(spotId);
      else next.add(spotId);
      onValueChange(Array.from(next));
    },
    [selected, onValueChange],
  );

  return (
    <StatusBlock
      loading={loading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage={emptyMessage}
    >
      <CheckboxList
        items={items.map((s) => ({ id: s.spotId, name: s.name }))}
        value={selected}
        onToggle={toggle}
      />
    </StatusBlock>
  );
}

function geoItemKey(item: GeoSearchSelection): string {
  return `${item.type}:${item.countryCode}:${item.regionId ?? ""}:${item.spotId ?? ""}`;
}

function geoTypeLabel(type: GeoSearchSelection["type"]): string {
  if (type === "country") return "Country";
  if (type === "region") return "Region";
  return "Spot";
}

function GeoInlineSearch({
  value,
  onValueChange,
}: {
  value: GeoSearchSelection | null;
  onValueChange: (next: GeoSearchSelection | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [remoteItems, setRemoteItems] = useState<GeoSearchSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const trimmed = query.trim();

  const countryItems = useMemo(() => {
    if (!trimmed) return [];
    return filterCountrySuggestions(trimmed).map(countryOptionToSelection);
  }, [trimmed]);

  const items = useMemo(() => {
    const seen = new Set<string>();
    const merged: GeoSearchSelection[] = [];
    for (const item of [...countryItems, ...remoteItems]) {
      const key = geoItemKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ ...item, label: buildGeoSearchLabel(item) });
    }
    return merged;
  }, [countryItems, remoteItems]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!trimmed) {
      setRemoteItems([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      void fetchGeoSuggest(trimmed)
        .then((rows) => {
          if (reqId !== requestIdRef.current) return;
          setRemoteItems(rows);
        })
        .catch(() => {
          if (reqId !== requestIdRef.current) return;
          setRemoteItems([]);
        })
        .finally(() => {
          if (reqId !== requestIdRef.current) return;
          setLoading(false);
        });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmed]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {buildGeoSearchLabel(value)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {geoTypeLabel(value.type)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onValueChange(null);
            setQuery("");
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Clear location"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Input
        type="search"
        placeholder="Search country, region, or spot…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 text-center text-sm"
        autoFocus
      />
      {trimmed ? (
        <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/30 p-1">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-3 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No matches.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={geoItemKey(item)}>
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(item);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="min-w-0 truncate">
                      {buildGeoSearchLabel(item)}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {geoTypeLabel(item.type)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Type to search…</p>
      )}
    </div>
  );
}

function ActiveSummary({
  tabId,
  draft,
  countryName,
  homeRegionName,
}: {
  tabId: FeedTabId;
  draft: FeedFiltersState;
  countryName: string | null;
  homeRegionName: string | null;
}) {
  if (tabId === "all") {
    if (!draft.all.geo) {
      return (
        <p className="text-xs text-muted-foreground">
          Pick a country, region, or spot to filter the feed.
        </p>
      );
    }
    return null;
  }
  if (tabId === "country") {
    return (
      <p className="text-xs text-muted-foreground">
        Showing waves in{" "}
        <span className="text-foreground">{countryName ?? "your country"}</span>
        {". Pick regions and spots to narrow it down."}
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">
      Pick one or more spots{homeRegionName ? ` in ${homeRegionName}` : ""}.
    </p>
  );
}

export function FeedFiltersPopover({
  activeTabId,
  countryCode,
  homeRegionId,
  homeRegionName,
  value,
  onApply,
  onReset,
}: {
  activeTabId: FeedTabId;
  countryCode: string | null;
  homeRegionId: string | null;
  homeRegionName: string | null;
  value: FeedFiltersState;
  onApply: (next: FeedFiltersState) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FeedFiltersState>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const countryName = countryCode ? englishCountryLabel(countryCode) : null;
  const active = isFilterActive(activeTabId, value);

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft(EMPTY_FEED_FILTERS);
    onReset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            active && "border-primary/60 text-primary",
          )}
          aria-label="Filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          {active ? (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-50 w-80 max-w-[calc(100vw-2rem)] space-y-3 p-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Filter feed</h4>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <ActiveSummary
          tabId={activeTabId}
          draft={draft}
          countryName={countryName}
          homeRegionName={homeRegionName}
        />

        {activeTabId === "all" ? (
          <GeoInlineSearch
            value={draft.all.geo}
            onValueChange={(next) =>
              setDraft((prev) => ({ ...prev, all: { geo: next } }))
            }
          />
        ) : null}

        {activeTabId === "country" && countryCode ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Regions
              </Label>
              <RegionMultiSelect
                countryCode={countryCode}
                value={draft.country.regionIds}
                onValueChange={(next) =>
                  setDraft((prev) => {
                    const validSpotIds = prev.country.spotIds;
                    return {
                      ...prev,
                      country: {
                        regionIds: next,
                        spotIds: next.length === 0 ? [] : validSpotIds,
                      },
                    };
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Spots
              </Label>
              <SpotMultiSelect
                regionIds={draft.country.regionIds}
                value={draft.country.spotIds}
                onValueChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    country: { ...prev.country, spotIds: next },
                  }))
                }
                emptyMessage={
                  draft.country.regionIds.length === 0
                    ? "Pick at least one region to choose spots."
                    : "No spots in the selected regions yet."
                }
              />
            </div>
          </div>
        ) : null}

        {activeTabId === "region" && homeRegionId ? (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Spots{homeRegionName ? ` in ${homeRegionName}` : ""}
            </Label>
            <SpotMultiSelect
              regionIds={[homeRegionId]}
              value={draft.region.spotIds}
              onValueChange={(next) =>
                setDraft((prev) => ({ ...prev, region: { spotIds: next } }))
              }
              emptyMessage="No spots in this region yet."
            />
            {draft.region.spotIds.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, region: { spotIds: [] } }))
                }
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear spot selection
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={!active}
          >
            Reset
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
