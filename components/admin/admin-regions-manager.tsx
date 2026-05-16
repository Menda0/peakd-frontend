"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CountryPicker } from "@/components/pickers/country-picker";
import type { AdminRegionDto } from "@/lib/admin-regions";
import { cn } from "@/lib/utils";
import {
  createAdminRegionAction,
  disableAdminRegionAction,
  listAdminRegionsAction,
  updateAdminRegionAction,
} from "@/app/[userSub]/(social)/admin/regions/actions";

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "verified" | "disabled" | "unverified";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "verified" && "bg-emerald-500/20 text-emerald-300",
        variant === "disabled" && "bg-zinc-500/30 text-zinc-300",
        variant === "unverified" && "bg-amber-500/20 text-amber-200",
      )}
    >
      {label}
    </span>
  );
}

export function AdminRegionsManager() {
  const countryFieldId = useId();
  const [countryCode, setCountryCode] = useState<string | null>("PT");
  const [regions, setRegions] = useState<AdminRegionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createVerified, setCreateVerified] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    if (!countryCode) {
      setRegions([]);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await listAdminRegionsAction(countryCode);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setRegions([]);
      return;
    }
    setRegions(res.data);
  }, [countryCode]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRegions();
    });
  }, [loadRegions]);

  const startEdit = (region: AdminRegionDto) => {
    setEditingId(region.regionId);
    setEditName(region.name);
    setEditVerified(region.verified);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditVerified(false);
  };

  const handleCreate = async () => {
    if (!countryCode || !createName.trim()) return;
    setCreateBusy(true);
    setError(null);
    const res = await createAdminRegionAction({
      countryCode,
      name: createName,
      verified: createVerified,
    });
    setCreateBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCreateName("");
    setCreateVerified(false);
    await loadRegions();
  };

  const handleSaveEdit = async (regionId: string) => {
    if (!editName.trim()) return;
    setRowBusy(regionId);
    setError(null);
    const res = await updateAdminRegionAction(regionId, {
      name: editName,
      verified: editVerified,
    });
    setRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    cancelEdit();
    await loadRegions();
  };

  const handleDisable = async (regionId: string) => {
    setRowBusy(regionId);
    setError(null);
    const res = await disableAdminRegionAction(regionId);
    setRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editingId === regionId) cancelEdit();
    await loadRegions();
  };

  const handleEnable = async (regionId: string) => {
    setRowBusy(regionId);
    setError(null);
    const res = await updateAdminRegionAction(regionId, { disabled: false });
    setRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await loadRegions();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Regions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage surf regions by country. Disabling hides a region from pickers but keeps existing
          session links.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Country</CardTitle>
          <CardDescription className="text-zinc-400">
            Choose a country to list and edit its regions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CountryPicker
            id={countryFieldId}
            label="Country"
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
          />
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Create region</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-sm text-zinc-400" htmlFor="admin-create-name">
              Name
            </label>
            <Input
              id="admin-create-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Ericeira"
              disabled={!countryCode || createBusy}
              className="border-white/15 bg-white/5 text-zinc-100"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={createVerified}
              onChange={(e) => setCreateVerified(e.target.checked)}
              disabled={!countryCode || createBusy}
              className="rounded border-white/20"
            />
            Verified
          </label>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!countryCode || !createName.trim() || createBusy}
          >
            {createBusy ? "Creating…" : "Create"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Regions</CardTitle>
          <CardDescription className="text-zinc-400">
            {loading
              ? "Loading…"
              : countryCode
                ? `${regions.length} region${regions.length === 1 ? "" : "s"}`
                : "Select a country"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!countryCode ? (
            <p className="text-sm text-zinc-500">Select a country above.</p>
          ) : regions.length === 0 && !loading ? (
            <p className="text-sm text-zinc-500">No regions for this country.</p>
          ) : (
            regions.map((region) => {
              const isEditing = editingId === region.regionId;
              const busy = rowBusy === region.regionId;
              return (
                <div
                  key={region.regionId}
                  className={cn(
                    "rounded-lg border border-white/10 p-4",
                    region.disabled && "opacity-60",
                  )}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1">
                        <label className="text-sm text-zinc-400">Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={busy}
                          className="border-white/15 bg-white/5 text-zinc-100"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={editVerified}
                          onChange={(e) => setEditVerified(e.target.checked)}
                          disabled={busy}
                          className="rounded border-white/20"
                        />
                        Verified
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSaveEdit(region.regionId)}
                          disabled={busy || !editName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={busy}
                          className="border-white/15 bg-transparent text-zinc-200"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-zinc-100">{region.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {region.disabled ? (
                            <StatusBadge label="Disabled" variant="disabled" />
                          ) : region.verified ? (
                            <StatusBadge label="Verified" variant="verified" />
                          ) : (
                            <StatusBadge label="Unverified" variant="unverified" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(region)}
                          disabled={busy || region.disabled}
                          className="border-white/15 bg-transparent text-zinc-200"
                        >
                          Edit
                        </Button>
                        {region.disabled ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleEnable(region.regionId)}
                            disabled={busy}
                          >
                            Enable
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleDisable(region.regionId)}
                            disabled={busy}
                            className="border-white/15 bg-transparent text-red-300 hover:text-red-200"
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
