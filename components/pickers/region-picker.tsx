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
  undisclosedRegionId,
  undisclosedRegionOption,
} from "@/lib/geo-undisclosed";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";

export type RegionOption = {
  regionId: string;
  name: string;
  verified: boolean;
};

function itemEqual(a: RegionOption, b: RegionOption) {
  return a.regionId === b.regionId;
}

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

export function RegionPicker({
  id,
  label = "Region",
  countryCode,
  regionId,
  onRegionIdChange,
  disabled,
  allowCreate = true,
  verifiedOnly = false,
  includeUndisclosedOption = false,
  positionerClassName,
}: {
  id?: string;
  label?: string;
  countryCode: string | null;
  regionId: string | null;
  onRegionIdChange: (id: string | null) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  verifiedOnly?: boolean;
  /** Prepends a default “Undisclosed” option (studio sessions). */
  includeUndisclosedOption?: boolean;
  positionerClassName?: string;
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
      const params = new URLSearchParams({ countryCode });
      if (verifiedOnly) params.set("verifiedOnly", "true");
      const res = await fetch(`${base}/studio/regions?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      let list = parseRegionList(await res.json());

      if (
        verifiedOnly &&
        regionId &&
        !list.some((r) => r.regionId === regionId)
      ) {
        const fallbackRes = await fetch(
          `${base}/studio/regions?${new URLSearchParams({ countryCode }).toString()}`,
          { credentials: "include" },
        );
        if (fallbackRes.ok) {
          const selected = parseRegionList(await fallbackRes.json()).find(
            (r) => r.regionId === regionId,
          );
          if (selected) list = [...list, selected];
        }
      }

      let sorted = sortGeoOptions(list);
      if (includeUndisclosedOption && countryCode) {
        const undisclosed = undisclosedRegionOption(countryCode);
        sorted = [
          undisclosed,
          ...sorted.filter((r) => r.regionId !== undisclosed.regionId),
        ];
      }
      setItems(sorted);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load regions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [countryCode, regionId, verifiedOnly, includeUndisclosedOption]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRegions();
    });
  }, [loadRegions]);

  useEffect(() => {
    queueMicrotask(() => setQuery(""));
  }, [countryCode]);

  const value = useMemo(() => {
    if (!regionId) return null;
    const found = items.find((r) => r.regionId === regionId);
    if (found) return found;
    if (includeUndisclosedOption && countryCode && regionId === undisclosedRegionId(countryCode)) {
      return undisclosedRegionOption(countryCode);
    }
    return null;
  }, [regionId, items, includeUndisclosedOption, countryCode]);

  const gated = !countryCode || disabled;
  const canCreate = allowCreate;

  const trimmedQuery = query.trim();
  const queryMatches = useMemo(
    () => filterGeoByQuery(items, trimmedQuery),
    [items, trimmedQuery],
  );

  const isUndisclosedSelected =
    includeUndisclosedOption &&
    Boolean(countryCode) &&
    regionId === undisclosedRegionId(countryCode!);

  const showAddButton =
    canCreate &&
    Boolean(countryCode) &&
    !isUndisclosedSelected &&
    !disabled &&
    !loading &&
    !gated &&
    trimmedQuery.length > 0 &&
    queryMatches.length === 0;

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
      const created = parseRegionList([await res.json()])[0];
      if (!created) throw new Error("Invalid create response");
      if (verifiedOnly && !created.verified) {
        setItems((prev) =>
          prev.some((r) => r.regionId === created.regionId)
            ? prev
            : [...prev, created],
        );
      } else {
        await loadRegions();
      }
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

  const inputTrailing = (
    <>
      {value?.verified ? <GeoVerifiedIcon /> : null}
      {showAddButton ? (
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
      ) : null}
    </>
  );

  return (
    <div className="space-y-2">
      <GeoCreateConfirmModal
        open={canCreate && confirmOpen}
        title="Create new region?"
        description={`Add “${pendingName}” as a new region for ${countryCode ?? ""}. You can use it in this session after confirming.`}
        confirmLabel="Create region"
        onCancel={closeConfirm}
        onConfirm={() => void submitNewRegion(pendingName)}
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
                  : canCreate
                    ? "Search or type a new region…"
                    : "Search regions…"
                : "Select a country first"
            }
            disabled={gated || loading}
            className={cn(
              "h-10 min-h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground",
              "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
            )}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.key !== "Enter") return;
              // Let the combobox select a highlighted match (e.g. "Ma" → "Praia da Mata").
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
                  ? "No verified regions."
                  : "No matches."}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: RegionOption) => (
                <ComboboxItem
                  key={item.regionId}
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
