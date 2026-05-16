"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";

export type RegionOption = {
  regionId: string;
  name: string;
  verified: boolean;
};

function itemEqual(a: RegionOption, b: RegionOption) {
  return a.regionId === b.regionId;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function RegionPicker({
  id,
  label = "Region",
  countryCode,
  regionId,
  onRegionIdChange,
  disabled,
  allowCreate = true,
  verifiedOnly = false,
}: {
  id?: string;
  label?: string;
  countryCode: string | null;
  regionId: string | null;
  onRegionIdChange: (id: string | null) => void;
  disabled?: boolean;
  /** When false, users cannot create new regions from this picker. */
  allowCreate?: boolean;
  /** When true, only verified regions are listed. */
  verifiedOnly?: boolean;
}) {
  const [items, setItems] = useState<RegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingBusy, setCreatingBusy] = useState(false);

  const loadRegions = useCallback(async () => {
    if (!countryCode) {
      setItems([]);
      return;
    }
    setListError(null);
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/studio/regions?countryCode=${encodeURIComponent(countryCode)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as RegionOption[];
      const list = Array.isArray(data) ? data : [];
      setItems(verifiedOnly ? list.filter((r) => r.verified) : list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load regions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [countryCode, verifiedOnly]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRegions();
    });
  }, [loadRegions]);

  useEffect(() => {
    queueMicrotask(() => setQuery(""));
  }, [countryCode]);

  const value = useMemo(
    () => (regionId ? items.find((r) => r.regionId === regionId) ?? null : null),
    [regionId, items],
  );

  const gated = !countryCode || disabled;

  const trimmedQuery = query.trim();
  const hasExactNameMatch = useMemo(() => {
    if (!trimmedQuery) return true;
    return items.some((r) => norm(r.name) === norm(trimmedQuery));
  }, [items, trimmedQuery]);

  const showAddButton =
    allowCreate &&
    Boolean(countryCode) &&
    !disabled &&
    !loading &&
    !gated &&
    trimmedQuery.length > 0 &&
    !hasExactNameMatch;

  const submitNewRegion = async (name: string) => {
    if (!countryCode || !name.trim()) return;
    setCreateError(null);
    setCreatingBusy(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/regions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, name: name.trim() }),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const created = (await res.json()) as RegionOption;
      await loadRegions();
      onRegionIdChange(created.regionId);
      setQuery("");
      setConfirmOpen(false);
      setPendingName("");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreatingBusy(false);
    }
  };

  const openConfirm = () => {
    const name = query.trim();
    if (!name || !countryCode) return;
    setPendingName(name);
    setCreateError(null);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (creatingBusy) return;
    setConfirmOpen(false);
    setPendingName("");
    setCreateError(null);
  };

  return (
    <div className="space-y-2">
      <GeoCreateConfirmModal
        open={allowCreate && confirmOpen}
        title="Create new region?"
        description={`Add “${pendingName}” as a new region for ${countryCode ?? ""}. You can use it in this session after confirming.`}
        confirmLabel="Create region"
        onCancel={closeConfirm}
        onConfirm={() => void submitNewRegion(pendingName)}
        isSubmitting={creatingBusy}
        error={createError}
      />

      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <Combobox
        items={items}
        value={value}
        onValueChange={(next) => {
          onRegionIdChange(next?.regionId ?? null);
        }}
        onInputValueChange={(next) => {
          setQuery(next);
        }}
        itemToStringLabel={(r) => r.name}
        isItemEqualToValue={itemEqual}
        autoHighlight
        disabled={gated || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={
            countryCode
              ? verifiedOnly
                ? "Search verified regions…"
                : allowCreate
                  ? "Search or type a new region…"
                  : "Search regions…"
              : "Select a country first"
          }
          disabled={gated || loading}
          className={cn(
            "h-10 min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
            "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
          )}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.key !== "Enter") return;
            if (!showAddButton) return;
            e.preventDefault();
            e.stopPropagation();
            openConfirm();
          }}
          trailingAddon={
            showAddButton ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-8 shrink-0 text-primary hover:bg-primary/15 hover:text-primary/90"
                title="Add as new region"
                aria-label="Add as new region"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openConfirm();
                }}
              >
                <Plus className="size-4" />
              </Button>
            ) : null
          }
        />
        <ComboboxContent
          className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
          align="start"
        >
          <ComboboxEmpty className="text-zinc-500">
            {loading ? "Loading…" : "No matches."}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: RegionOption) => (
              <ComboboxItem
                key={item.regionId}
                value={item}
                className="text-zinc-200 data-highlighted:bg-primary/15 data-highlighted:text-zinc-50"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{item.name}</span>
                  {item.verified ? (
                    <span className="shrink-0 text-xs text-emerald-400/90">Verified</span>
                  ) : null}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {listError ? <p className="text-sm text-red-400">{listError}</p> : null}
    </div>
  );
}
