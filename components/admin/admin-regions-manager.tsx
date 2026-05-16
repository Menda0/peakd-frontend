"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountryPicker } from "@/components/pickers/country-picker";
import { AdminCreateRegionModal } from "@/components/admin/admin-create-region-modal";
import {
  AdminStatusBadge,
  adminStatusVariant,
} from "@/components/admin/admin-status-badge";
import type { AdminRegionDto } from "@/lib/admin-regions";
import { cn } from "@/lib/utils";
import {
  createAdminRegionAction,
  listAdminRegionsAction,
} from "@/app/[userSub]/(social)/admin/regions/actions";

export function AdminRegionsManager({ regionsBasePath }: { regionsBasePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryFieldId = useId();
  const initialCountry = searchParams.get("country")?.trim().toUpperCase() || "PT";
  const [countryCode, setCountryCode] = useState<string | null>(initialCountry);
  const [regions, setRegions] = useState<AdminRegionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreate = async (input: { name: string; verified: boolean }) => {
    if (!countryCode || !input.name.trim()) return;
    setCreateBusy(true);
    setCreateError(null);
    const res = await createAdminRegionAction({
      countryCode,
      name: input.name,
      verified: input.verified,
    });
    setCreateBusy(false);
    if (!res.ok) {
      setCreateError(res.error);
      return;
    }
    setCreateOpen(false);
    router.push(
      `${regionsBasePath}/${encodeURIComponent(res.data.regionId)}?country=${encodeURIComponent(countryCode)}`,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Regions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select a country, then click a region to edit it and manage its spots.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Country</CardTitle>
          <CardDescription className="text-zinc-400">
            Filter regions by country.
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
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-zinc-100">Regions</CardTitle>
            <CardDescription className="text-zinc-400">
              {loading
                ? "Loading…"
                : countryCode
                  ? `${regions.length} region${regions.length === 1 ? "" : "s"}`
                  : "Select a country"}
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            disabled={!countryCode}
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden />
            Add region
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!countryCode ? (
            <p className="text-sm text-zinc-500">Select a country above.</p>
          ) : regions.length === 0 && !loading ? (
            <p className="text-sm text-zinc-500">No regions for this country.</p>
          ) : (
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 text-right font-medium">Spots</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => {
                  const editHref = `${regionsBasePath}/${encodeURIComponent(region.regionId)}?country=${encodeURIComponent(countryCode)}`;
                  return (
                    <tr
                      key={region.regionId}
                      className={cn(
                        "cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5",
                        region.disabled && "opacity-60",
                      )}
                      onClick={() => router.push(editHref)}
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={editHref}
                          className="font-medium text-zinc-100 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {region.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <AdminStatusBadge
                          label={
                            region.disabled
                              ? "Disabled"
                              : region.verified
                                ? "Verified"
                                : "Unverified"
                          }
                          variant={adminStatusVariant(region.disabled, region.verified)}
                        />
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">{region.countryCode}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-zinc-300">
                        {region.spotCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AdminCreateRegionModal
        open={createOpen}
        countryCode={countryCode}
        onClose={() => {
          if (!createBusy) setCreateOpen(false);
        }}
        onCreate={(input) => void handleCreate(input)}
        isSubmitting={createBusy}
        error={createError}
      />
    </div>
  );
}
