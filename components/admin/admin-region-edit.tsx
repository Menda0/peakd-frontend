"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminCreateSpotModal,
  type AdminCreateSpotInput,
} from "@/components/admin/admin-create-spot-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SpotBreakTypeSelect,
  SpotConsistencySelect,
  SpotLevelMultiSelect,
} from "@/components/admin/spot-attribute-fields";
import { FormCheckboxField, FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { formInputClassName } from "@/lib/form-styles";
import {
  formatSpotLevels,
  isSpotBreakType,
  isSpotConsistency,
  parseSpotLevels,
  type SpotBreakType,
  type SpotConsistency,
  type SpotLevelId,
} from "@/lib/spot-attributes";
import { CountryPicker } from "@/components/pickers/country-picker";
import {
  AdminStatusBadge,
  adminStatusVariant,
} from "@/components/admin/admin-status-badge";
import type { AdminRegionDto } from "@/lib/admin-regions";
import type { AdminSpotDto } from "@/lib/admin-spots";
import { cn } from "@/lib/utils";
import {
  createAdminSpotAction,
  disableAdminRegionAction,
  disableAdminSpotAction,
  getAdminRegionAction,
  listAdminSpotsAction,
  updateAdminRegionAction,
  updateAdminSpotAction,
} from "@/app/[userSub]/(social)/admin/regions/[regionId]/actions";

const emptySpotForm = () => ({
  name: "",
  levels: [] as SpotLevelId[],
  breakType: "" as SpotBreakType | "",
  consistency: "" as SpotConsistency | "",
  verified: false,
});

export function AdminRegionEdit({
  regionId,
  regionsListHref,
}: {
  regionId: string;
  regionsListHref: string;
}) {
  const [region, setRegion] = useState<AdminRegionDto | null>(null);
  const [spots, setSpots] = useState<AdminSpotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regionBusy, setRegionBusy] = useState(false);

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const [createSpotOpen, setCreateSpotOpen] = useState(false);
  const [spotCreateBusy, setSpotCreateBusy] = useState(false);
  const [spotCreateError, setSpotCreateError] = useState<string | null>(null);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [spotEdit, setSpotEdit] = useState(emptySpotForm());
  const [spotRowBusy, setSpotRowBusy] = useState<string | null>(null);

  const applyRegion = useCallback((r: AdminRegionDto) => {
    setRegion(r);
    setName(r.name);
    setCountryCode(r.countryCode);
    setVerified(r.verified);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [regionRes, spotsRes] = await Promise.all([
      getAdminRegionAction(regionId),
      listAdminSpotsAction(regionId),
    ]);
    setLoading(false);
    if (!regionRes.ok) {
      setError(regionRes.error);
      return;
    }
    applyRegion(regionRes.data);
    if (!spotsRes.ok) {
      setError(spotsRes.error);
      setSpots([]);
      return;
    }
    setSpots(spotsRes.data);
  }, [applyRegion, regionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, [loadAll]);

  const handleSaveRegion = async () => {
    if (!name.trim() || !countryCode) return;
    setRegionBusy(true);
    setError(null);
    const res = await updateAdminRegionAction(regionId, {
      name,
      countryCode,
      verified,
    });
    setRegionBusy(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    applyRegion(res.data);
    toast.success("Region saved");
  };

  const handleDisableRegion = async () => {
    setRegionBusy(true);
    setError(null);
    const res = await disableAdminRegionAction(regionId);
    setRegionBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    applyRegion(res.data);
  };

  const handleEnableRegion = async () => {
    setRegionBusy(true);
    setError(null);
    const res = await updateAdminRegionAction(regionId, { disabled: false });
    setRegionBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    applyRegion(res.data);
  };

  const handleCreateSpot = async (input: AdminCreateSpotInput) => {
    if (!input.name.trim()) return;
    setSpotCreateBusy(true);
    setSpotCreateError(null);
    const res = await createAdminSpotAction(regionId, input);
    setSpotCreateBusy(false);
    if (!res.ok) {
      setSpotCreateError(res.error);
      return;
    }
    setCreateSpotOpen(false);
    const spotsRes = await listAdminSpotsAction(regionId);
    if (spotsRes.ok) setSpots(spotsRes.data);
  };

  const startSpotEdit = (spot: AdminSpotDto) => {
    setEditingSpotId(spot.spotId);
    setSpotEdit({
      name: spot.name,
      levels: parseSpotLevels(spot.level),
      breakType:
        spot.breakType && isSpotBreakType(spot.breakType) ? spot.breakType : "",
      consistency:
        spot.consistency && isSpotConsistency(spot.consistency)
          ? spot.consistency
          : "",
      verified: spot.verified,
    });
  };

  const cancelSpotEdit = () => {
    setEditingSpotId(null);
    setSpotEdit(emptySpotForm());
  };

  const handleSaveSpot = async (spotId: string) => {
    if (!spotEdit.name.trim()) return;
    setSpotRowBusy(spotId);
    setError(null);
    const res = await updateAdminSpotAction(regionId, spotId, {
      name: spotEdit.name,
      level: formatSpotLevels(spotEdit.levels),
      breakType: spotEdit.breakType || null,
      consistency: spotEdit.consistency || null,
      verified: spotEdit.verified,
    });
    setSpotRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    cancelSpotEdit();
    const spotsRes = await listAdminSpotsAction(regionId);
    if (spotsRes.ok) setSpots(spotsRes.data);
    toast.success("Spot saved");
  };

  const handleDisableSpot = async (spotId: string) => {
    setSpotRowBusy(spotId);
    setError(null);
    const res = await disableAdminSpotAction(regionId, spotId);
    setSpotRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editingSpotId === spotId) cancelSpotEdit();
    const spotsRes = await listAdminSpotsAction(regionId);
    if (spotsRes.ok) setSpots(spotsRes.data);
  };

  const handleEnableSpot = async (spotId: string) => {
    setSpotRowBusy(spotId);
    setError(null);
    const res = await updateAdminSpotAction(regionId, spotId, { disabled: false });
    setSpotRowBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const spotsRes = await listAdminSpotsAction(regionId);
    if (spotsRes.ok) setSpots(spotsRes.data);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading region…</p>;
  }

  if (!region) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-200">{error ?? "Region not found."}</p>
        <Link
          href={regionsListHref}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm text-foreground hover:bg-accent"
        >
          Back to regions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={regionsListHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Regions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {region.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit region details and manage spots.</p>
        </div>
        <AdminStatusBadge
          label={region.disabled ? "Disabled" : region.verified ? "Verified" : "Unverified"}
          variant={adminStatusVariant(region.disabled, region.verified)}
        />
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <Card className="border-border bg-muted/50">
        <CardHeader>
          <CardTitle className="text-foreground">Region</CardTitle>
          <CardDescription className="text-muted-foreground">
            Changes apply to how this region appears across Peakd.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={regionBusy || region.disabled}
                className={formInputClassName}
              />
            </FormField>
            <CountryPicker
              label="Country"
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              disabled={regionBusy || region.disabled}
            />
          </div>
          <FormCheckboxField
            label="Verified"
            checked={verified}
            onCheckedChange={setVerified}
            disabled={regionBusy || region.disabled}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleSaveRegion()}
              disabled={regionBusy || region.disabled || !name.trim() || !countryCode}
            >
              {regionBusy ? "Saving…" : "Save region"}
            </Button>
            {region.disabled ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleEnableRegion()}
                disabled={regionBusy}
                className="border-border bg-transparent text-foreground"
              >
                Enable region
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDisableRegion()}
                disabled={regionBusy}
                className="border-border bg-transparent text-red-300"
              >
                Disable region
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      <Card className="border-border bg-muted/50">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-foreground">Spots</CardTitle>
            <CardDescription className="text-muted-foreground">
              {spots.length} spot{spots.length === 1 ? "" : "s"} in this region
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSpotCreateError(null);
              setCreateSpotOpen(true);
            }}
            disabled={region.disabled}
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden />
            Add spot
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {spots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spots yet.</p>
          ) : (
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Level</th>
                  <th className="py-2 pr-3 font-medium">Break</th>
                  <th className="py-2 pr-3 font-medium">Consistency</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spots.map((spot) => {
                  const isEditing = editingSpotId === spot.spotId;
                  const busy = spotRowBusy === spot.spotId;
                  if (isEditing) {
                    return (
                      <tr key={spot.spotId} className="border-b border-border bg-muted/50">
                        <td className="py-2 pr-3">
                          <Input
                            value={spotEdit.name}
                            onChange={(e) =>
                              setSpotEdit((f) => ({ ...f, name: e.target.value }))
                            }
                            disabled={busy}
                            className={formInputClassName}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <SpotLevelMultiSelect
                            value={spotEdit.levels}
                            onChange={(levels) =>
                              setSpotEdit((f) => ({ ...f, levels }))
                            }
                            disabled={busy}
                            className="min-w-[9rem]"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <SpotBreakTypeSelect
                            value={spotEdit.breakType}
                            onChange={(breakType) =>
                              setSpotEdit((f) => ({ ...f, breakType }))
                            }
                            disabled={busy}
                            showLabel={false}
                            className="min-w-[10rem]"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <SpotConsistencySelect
                            value={spotEdit.consistency}
                            onChange={(consistency) =>
                              setSpotEdit((f) => ({ ...f, consistency }))
                            }
                            disabled={busy}
                            showLabel={false}
                            className="min-w-[8rem]"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <FormCheckboxField
                            label="Verified"
                            checked={spotEdit.verified}
                            onCheckedChange={(v) =>
                              setSpotEdit((f) => ({ ...f, verified: v }))
                            }
                            disabled={busy}
                            labelClassName="text-xs"
                          />
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleSaveSpot(spot.spotId)}
                              disabled={busy || !spotEdit.name.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={cancelSpotEdit}
                              disabled={busy}
                              className="border-border bg-transparent"
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={spot.spotId}
                      className={cn(
                        "border-b border-border/50",
                        spot.disabled && "opacity-60",
                      )}
                    >
                      <td className="py-3 pr-3 font-medium text-foreground">{spot.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{spot.level ?? "—"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{spot.breakType ?? "—"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{spot.consistency ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <AdminStatusBadge
                          label={
                            spot.disabled
                              ? "Disabled"
                              : spot.verified
                                ? "Verified"
                                : "Unverified"
                          }
                          variant={adminStatusVariant(spot.disabled, spot.verified)}
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startSpotEdit(spot)}
                            disabled={busy || spot.disabled}
                            className="border-border bg-transparent text-foreground"
                          >
                            Edit
                          </Button>
                          {spot.disabled ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleEnableSpot(spot.spotId)}
                              disabled={busy}
                            >
                              Enable
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleDisableSpot(spot.spotId)}
                              disabled={busy}
                              className="border-border bg-transparent text-red-300"
                            >
                              Disable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AdminCreateSpotModal
        open={createSpotOpen}
        regionName={region.name}
        onClose={() => {
          if (!spotCreateBusy) setCreateSpotOpen(false);
        }}
        onCreate={(input) => void handleCreateSpot(input)}
        isSubmitting={spotCreateBusy}
        error={spotCreateError}
      />
    </div>
  );
}
