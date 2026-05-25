"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { GeoVerifiedIcon } from "@/components/pickers/geo-verified-icon";
import {
  buildGeoSearchLabel,
  countryOptionToSelection,
  fetchGeoSuggest,
  filterCountrySuggestions,
  type GeoSearchSelection,
} from "@/lib/feed-search";
import { cn } from "@/lib/utils";

function geoItemKey(item: GeoSearchSelection): string {
  return `${item.type}:${item.countryCode}:${item.regionId ?? ""}:${item.spotId ?? ""}`;
}

function itemsEqual(a: GeoSearchSelection, b: GeoSearchSelection): boolean {
  return geoItemKey(a) === geoItemKey(b);
}

function typeLabel(type: GeoSearchSelection["type"]): string {
  if (type === "country") return "Country";
  if (type === "region") return "Region";
  return "Spot";
}

export function FeedGeoSearchInput({
  value,
  onValueChange,
  className,
}: {
  value: GeoSearchSelection | null;
  onValueChange: (next: GeoSearchSelection | null) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [remoteItems, setRemoteItems] = useState<GeoSearchSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const countryItems = useMemo(() => {
    if (!query.trim()) return [];
    return filterCountrySuggestions(query).map(countryOptionToSelection);
  }, [query]);

  const items = useMemo(() => {
    const seen = new Set<string>();
    const merged: GeoSearchSelection[] = [];
    for (const item of [...countryItems, ...remoteItems]) {
      const key = geoItemKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        ...item,
        label: buildGeoSearchLabel(item),
      });
    }
    return merged;
  }, [countryItems, remoteItems]);

  useEffect(() => {
    if (value) {
      setQuery(buildGeoSearchLabel(value));
    }
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setRemoteItems([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      void fetchGeoSuggest(q)
        .then((rows) => {
          if (reqId !== requestIdRef.current) return;
          setRemoteItems(
            rows.map((row) => ({ ...row, label: buildGeoSearchLabel(row) })),
          );
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
  }, [query]);

  const handleValueChange = useCallback(
    (next: GeoSearchSelection | null) => {
      onValueChange(next);
      if (next) {
        setQuery(buildGeoSearchLabel(next));
      } else {
        setQuery("");
      }
    },
    [onValueChange],
  );

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={handleValueChange}
      onInputValueChange={(next) => {
        setQuery(next);
        if (!next.trim()) {
          onValueChange(null);
        }
      }}
      itemToStringLabel={(item) => buildGeoSearchLabel(item)}
      isItemEqualToValue={itemsEqual}
      autoHighlight
    >
      <ComboboxInput
        placeholder="Search country, region, or spot…"
        showTrigger={false}
        showClear={Boolean(value || query.trim())}
        className={cn(
          "h-11 min-h-11 rounded-full border-white/10 bg-white/5 py-2 pl-11 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500",
          "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
          className,
        )}
      />
      <ComboboxContent
        className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
        positionerClassName="z-50"
      >
        <ComboboxList>
          {loading && items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
          ) : null}
          {items.map((item) => (
            <ComboboxItem
              key={geoItemKey(item)}
              value={item}
              className="gap-2 data-[highlighted]:bg-white/10"
            >
              <span className="min-w-0 flex-1 truncate">{buildGeoSearchLabel(item)}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">
                {typeLabel(item.type)}
              </span>
              {item.type !== "country" ? <GeoVerifiedIcon /> : null}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>
            {query.trim() ? "No verified locations found." : "Type to search…"}
          </ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
