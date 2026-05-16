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
import { Field, FieldLabel } from "@/components/ui/field";
import { GeoVerifiedIcon } from "@/components/pickers/geo-verified-icon";
import { formLabelClassName } from "@/lib/form-styles";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";
import { isGeoVerified, sortGeoOptions } from "@/lib/geo-picker-utils";
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

export function SpotPicker({
  id,
  label = "Spot",
  regionId,
  spotId,
  onSpotIdChange,
  disabled,
  allowCreate = true,
  verifiedOnly = false,
  positionerClassName,
}: {
  id?: string;
  label?: string;
  regionId: string | null;
  spotId: string | null;
  onSpotIdChange: (id: string | null) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  verifiedOnly?: boolean;
  positionerClassName?: string;
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
      const params = new URLSearchParams({ regionId });
      if (verifiedOnly) params.set("verifiedOnly", "true");
      const res = await fetch(`${base}/studio/spots?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      let list = parseSpotList(await res.json());

      if (verifiedOnly && spotId && !list.some((s) => s.spotId === spotId)) {
        const fallbackRes = await fetch(
          `${base}/studio/spots?${new URLSearchParams({ regionId }).toString()}`,
          { credentials: "include" },
        );
        if (fallbackRes.ok) {
          const selected = parseSpotList(await fallbackRes.json()).find(
            (s) => s.spotId === spotId,
          );
          if (selected) list = [...list, selected];
        }
      }

      setItems(sortGeoOptions(list));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load spots");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [regionId, spotId, verifiedOnly]);

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
  const canCreate = allowCreate;

  const trimmedQuery = query.trim();
  const hasExactNameMatch = useMemo(() => {
    if (!trimmedQuery) return true;
    return items.some((s) => norm(s.name) === norm(trimmedQuery));
  }, [items, trimmedQuery]);

  const showAddButton =
    canCreate &&
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
      const created = parseSpotList([await res.json()])[0];
      if (!created) throw new Error("Invalid create response");
      if (verifiedOnly && !created.verified) {
        setItems((prev) =>
          prev.some((s) => s.spotId === created.spotId) ? prev : [...prev, created],
        );
      } else {
        await loadSpots();
      }
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

  const inputTrailing = (
    <>
      {value?.verified ? <GeoVerifiedIcon /> : null}
      {showAddButton ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 text-primary hover:bg-primary/15 hover:text-primary/90"
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
      ) : null}
    </>
  );

  return (
    <div className="space-y-2">
      <GeoCreateConfirmModal
        open={canCreate && confirmOpen}
        title="Create new spot?"
        description={`Add “${pendingName}” as a new spot in this region. You can use it in this session after confirming.`}
        confirmLabel="Create spot"
        onCancel={closeConfirm}
        onConfirm={() => void submitNewSpot(pendingName)}
        isSubmitting={creatingBusy}
        error={createError}
      />

      <Field className="w-full">
        <FieldLabel htmlFor={id} className={formLabelClassName}>
          {label}
        </FieldLabel>
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
            placeholder={
              regionId
                ? verifiedOnly
                  ? "Search verified spots…"
                  : canCreate
                    ? "Search or type a new spot…"
                    : "Search spots…"
                : "Select a region first"
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
            trailingAddon={inputTrailing}
          />
          <ComboboxContent
            className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
            positionerClassName={positionerClassName}
            align="start"
          >
            <ComboboxEmpty className="text-zinc-500">
              {loading
                ? "Loading…"
                : verifiedOnly
                  ? "No verified spots."
                  : "No matches."}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: SpotOption) => (
                <ComboboxItem
                  key={item.spotId}
                  value={item}
                  className="text-zinc-200 data-highlighted:bg-primary/15 data-highlighted:text-zinc-50"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{item.name}</span>
                    {item.verified ? <GeoVerifiedIcon /> : null}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      {listError ? <p className="text-sm text-red-400">{listError}</p> : null}
    </div>
  );
}
