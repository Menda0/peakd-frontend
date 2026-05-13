"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";

export type SpotOption = {
  spotId: string;
  name: string;
  verified: boolean;
};

function itemEqual(a: SpotOption, b: SpotOption) {
  return a.spotId === b.spotId;
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
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

  const value = useMemo(
    () => (spotId ? items.find((s) => s.spotId === spotId) ?? null : null),
    [spotId, items],
  );

  const submitNewSpot = async () => {
    if (!regionId || !newName.trim()) return;
    setCreateError(null);
    setCreatingBusy(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/spots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId, name: newName.trim() }),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const created = (await res.json()) as SpotOption;
      await loadSpots();
      onSpotIdChange(created.spotId);
      setNewName("");
      setCreating(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreatingBusy(false);
    }
  };

  const gated = !regionId || disabled;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <Combobox
        items={items}
        value={value}
        onValueChange={(next) => {
          onSpotIdChange(next?.spotId ?? null);
        }}
        isItemEqualToValue={itemEqual}
        autoHighlight
        disabled={gated || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={regionId ? "Search spot…" : "Select a region first"}
          disabled={gated || loading}
          className={cn(
            "h-10 w-full min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
            "focus-within:border-[#26c2c9]/60 focus-within:ring-2 focus-within:ring-[#26c2c9]/25",
          )}
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
      {regionId && !disabled ? (
        <div className="space-y-2">
          {!creating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
              onClick={() => setCreating(true)}
            >
              New spot
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-xs text-zinc-500">Name</span>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Spot name"
                  className="border-white/15 bg-white/5 text-zinc-100"
                  disabled={creatingBusy}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
                  disabled={creatingBusy || !newName.trim()}
                  onClick={() => void submitNewSpot()}
                >
                  {creatingBusy ? "Saving…" : "Add"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400"
                  disabled={creatingBusy}
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                    setCreateError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {createError ? <p className="text-sm text-red-400">{createError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
