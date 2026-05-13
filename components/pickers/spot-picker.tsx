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

export type SpotOption = {
  spotId: string;
  name: string;
  verified: boolean;
};

function itemEqual(a: SpotOption, b: SpotOption) {
  return a.spotId === b.spotId;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function SpotPicker({
  id,
  label = "Spot",
  regionId,
  spotId,
  onSpotIdChange,
  disabled,
}: {
  id?: string;
  label?: string;
  regionId: string | null;
  spotId: string | null;
  onSpotIdChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<SpotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingBusy, setCreatingBusy] = useState(false);

  const loadSpots = useCallback(async () => {
    if (!regionId) {
      setItems([]);
      return;
    }
    setListError(null);
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/studio/spots?regionId=${encodeURIComponent(regionId)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as SpotOption[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load spots");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSpots();
    });
  }, [loadSpots]);

  useEffect(() => {
    queueMicrotask(() => setQuery(""));
  }, [regionId]);

  const value = useMemo(
    () => (spotId ? items.find((s) => s.spotId === spotId) ?? null : null),
    [spotId, items],
  );

  const gated = !regionId || disabled;

  const trimmedQuery = query.trim();
  const hasExactNameMatch = useMemo(() => {
    if (!trimmedQuery) return true;
    return items.some((s) => norm(s.name) === norm(trimmedQuery));
  }, [items, trimmedQuery]);

  const showAddButton =
    Boolean(regionId) &&
    !disabled &&
    !loading &&
    !gated &&
    trimmedQuery.length > 0 &&
    !hasExactNameMatch;

  const submitNewSpot = async (name: string) => {
    if (!regionId || !name.trim()) return;
    setCreateError(null);
    setCreatingBusy(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/spots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId, name: name.trim() }),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const created = (await res.json()) as SpotOption;
      await loadSpots();
      onSpotIdChange(created.spotId);
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
    if (!name || !regionId) return;
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
        open={confirmOpen}
        title="Create new spot?"
        description={`Add “${pendingName}” as a new spot in this region. You can use it in this session after confirming.`}
        confirmLabel="Create spot"
        onCancel={closeConfirm}
        onConfirm={() => void submitNewSpot(pendingName)}
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
          onSpotIdChange(next?.spotId ?? null);
        }}
        onInputValueChange={(next) => {
          setQuery(next);
        }}
        itemToStringLabel={(s) => s.name}
        isItemEqualToValue={itemEqual}
        autoHighlight
        disabled={gated || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={regionId ? "Search or type a new spot…" : "Select a region first"}
          disabled={gated || loading}
          className={cn(
            "h-10 min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
            "focus-within:border-[#26c2c9]/60 focus-within:ring-2 focus-within:ring-[#26c2c9]/25",
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
                className="size-8 shrink-0 text-[#26c2c9] hover:bg-[#26c2c9]/15 hover:text-[#2dd4dc]"
                title="Add as new spot"
                aria-label="Add as new spot"
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
            {(item: SpotOption) => (
              <ComboboxItem
                key={item.spotId}
                value={item}
                className="text-zinc-200 data-highlighted:bg-[#26c2c9]/15 data-highlighted:text-zinc-50"
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
