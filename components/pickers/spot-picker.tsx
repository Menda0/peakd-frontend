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
import {
  filterGeoByQuery,
  isGeoVerified,
  sortGeoOptions,
} from "@/lib/geo-picker-utils";
import {
  isUndisclosedRegionId,
  undisclosedSpotId,
  undisclosedSpotOption,
} from "@/lib/geo-undisclosed";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";

export type SpotOption = {
  spotId: string;
  name: string;
  verified: boolean;
};

function itemEqual(a: SpotOption, b: SpotOption) {
  return a.spotId === b.spotId;
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
  countryCode = null,
  regionId,
  spotId,
  onSpotIdChange,
  disabled,
  allowCreate = true,
  verifiedOnly = false,
  includeUndisclosedOption = false,
  positionerClassName,
}: {
  id?: string;
  label?: string;
  /** Required when `includeUndisclosedOption` is true. */
  countryCode?: string | null;
  regionId: string | null;
  spotId: string | null;
  onSpotIdChange: (id: string | null) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  verifiedOnly?: boolean;
  includeUndisclosedOption?: boolean;
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
    if (
      includeUndisclosedOption &&
      countryCode &&
      isUndisclosedRegionId(regionId, countryCode)
    ) {
      setListError(null);
      setItems([undisclosedSpotOption(countryCode)]);
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

      let sorted = sortGeoOptions(list);
      if (
        includeUndisclosedOption &&
        countryCode &&
        isUndisclosedRegionId(regionId, countryCode)
      ) {
        const undisclosed = undisclosedSpotOption(countryCode);
        sorted = [
          undisclosed,
          ...sorted.filter((s) => s.spotId !== undisclosed.spotId),
        ];
      }
      setItems(sorted);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load spots");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [regionId, spotId, verifiedOnly, includeUndisclosedOption, countryCode]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSpots();
    });
  }, [loadSpots]);

  useEffect(() => {
    queueMicrotask(() => setQuery(""));
  }, [regionId]);

  const value = useMemo(() => {
    if (!spotId) return null;
    const found = items.find((s) => s.spotId === spotId);
    if (found) return found;
    if (
      includeUndisclosedOption &&
      countryCode &&
      spotId === undisclosedSpotId(countryCode)
    ) {
      return undisclosedSpotOption(countryCode);
    }
    return null;
  }, [spotId, items, includeUndisclosedOption, countryCode]);

  const gated = !regionId || disabled;
  const canCreate = allowCreate;

  const trimmedQuery = query.trim();
  const queryMatches = useMemo(
    () => filterGeoByQuery(items, trimmedQuery),
    [items, trimmedQuery],
  );

  const isUndisclosedRegion =
    includeUndisclosedOption &&
    Boolean(countryCode && regionId) &&
    isUndisclosedRegionId(regionId!, countryCode!);

  const showAddButton =
    canCreate &&
    Boolean(regionId) &&
    !isUndisclosedRegion &&
    !disabled &&
    !loading &&
    !gated &&
    trimmedQuery.length > 0 &&
    queryMatches.length === 0;

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
              "h-10 min-h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground",
              "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
            )}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.key !== "Enter") return;
              if (queryMatches.length > 0) return;
              if (!showAddButton) return;
              e.preventDefault();
              e.stopPropagation();
              openConfirm();
            }}
            trailingAddon={inputTrailing}
          />
          <ComboboxContent
            className="border-border bg-popover text-foreground ring-white/10"
            positionerClassName={positionerClassName}
            align="start"
          >
            <ComboboxEmpty className="text-muted-foreground">
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
                  className="text-foreground data-highlighted:bg-primary/15 data-highlighted:text-foreground"
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
