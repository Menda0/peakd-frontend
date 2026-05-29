"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import {
  formatDiscountSummary,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import { undisclosedRegionId } from "@/lib/geo-undisclosed";
import { surflineConditionsLabel } from "@/lib/surfline-conditions";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import type { StudioSessionFormValues } from "@/components/studio/studio-session-form-fields";
import type { StudioSessionMode } from "@/components/studio/studio-session-mode-choice";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-36">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground">{value}</dd>
    </div>
  );
}

async function resolveGeoNames(
  countryCode: string | null,
  regionId: string | null,
  spotId: string | null,
): Promise<{ regionName: string; spotName: string }> {
  if (!countryCode || !regionId || !spotId) {
    return { regionName: "—", spotName: "—" };
  }
  if (regionId === undisclosedRegionId(countryCode)) {
    return { regionName: "Undisclosed", spotName: "Undisclosed" };
  }
  const base = getApiBase();
  let regionName = regionId;
  let spotName = spotId;
  try {
    const [rRes, sRes] = await Promise.all([
      fetch(
        `${base}/studio/regions?${new URLSearchParams({ countryCode }).toString()}`,
        { credentials: "include" },
      ),
      fetch(
        `${base}/studio/spots?${new URLSearchParams({ regionId }).toString()}`,
        { credentials: "include" },
      ),
    ]);
    if (rRes.ok) {
      const regions = (await rRes.json()) as { regionId: string; name?: string }[];
      const r = Array.isArray(regions)
        ? regions.find((x) => x.regionId === regionId)
        : null;
      if (r?.name) regionName = r.name;
    }
    if (sRes.ok) {
      const spots = (await sRes.json()) as { spotId: string; name?: string }[];
      const s = Array.isArray(spots) ? spots.find((x) => x.spotId === spotId) : null;
      if (s?.name) spotName = s.name;
    }
  } catch {
    /* keep ids as fallback */
  }
  return { regionName, spotName };
}

export function StudioNewSessionSummary({
  values,
  sessionMode,
  showTypeStep,
  partnerCommercialDefaults,
}: {
  values: StudioSessionFormValues;
  sessionMode: StudioSessionMode | null;
  showTypeStep: boolean;
  partnerCommercialDefaults: CommercialSettings | null;
}) {
  const [geoNames, setGeoNames] = useState({ regionName: "…", spotName: "…" });

  useEffect(() => {
    let cancelled = false;
    void resolveGeoNames(values.countryCode, values.regionId, values.spotId).then(
      (names) => {
        if (!cancelled) setGeoNames(names);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [values.countryCode, values.regionId, values.spotId]);

  const modeLabel =
    sessionMode === "commercial" || values.isCommercial
      ? "Commercial"
      : "Free Surf";

  const conditionsLabel =
    surflineConditionsLabel(values.conditionsRating) ?? "No rating";

  const waveLabel =
    values.waveTypes.length > 0
      ? values.waveTypes.map((id) => waveTypeTitle(id)).join(", ")
      : "None selected";

  let commercialLabel = "—";
  if (values.isCommercial) {
    if (values.customizeCommercialPricing && values.commercialSettings) {
      commercialLabel = formatDiscountSummary(values.commercialSettings);
    } else if (partnerCommercialDefaults) {
      commercialLabel = `Partner defaults · ${formatDiscountSummary(partnerCommercialDefaults)}`;
    } else {
      commercialLabel = "Partner defaults (not configured)";
    }
  }

  const dateLabel = values.sessionDate
    ? new Date(`${values.sessionDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <dl className="flex flex-col gap-4 rounded-lg border border-border bg-white/[0.02] p-4">
      {showTypeStep ? <SummaryRow label="Session type" value={modeLabel} /> : null}
      <SummaryRow label="Country" value={values.countryCode ?? "—"} />
      <SummaryRow label="Region" value={geoNames.regionName} />
      <SummaryRow label="Spot" value={geoNames.spotName} />
      <SummaryRow label="Date" value={dateLabel} />
      <SummaryRow
        label="Start & duration"
        value={`${values.sessionTime} · ${formatDurationMinutes(values.durationMinutes)}`}
      />
      <SummaryRow label="Conditions" value={conditionsLabel} />
      <SummaryRow label="Wave types" value={waveLabel} />
      {values.isCommercial ? (
        <SummaryRow label="Pricing" value={commercialLabel} />
      ) : null}
    </dl>
  );
}
