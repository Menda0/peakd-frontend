"use client";

import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { SpotPicker } from "@/components/pickers/spot-picker";
import { SessionDatePicker } from "@/components/studio/session-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WAVE_TYPE_OPTIONS,
  formatDurationMinutes,
  type WaveTypeId,
} from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

export type StudioSessionFormValues = {
  countryCode: string | null;
  regionId: string | null;
  spotId: string | null;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: WaveTypeId[];
};

export function StudioSessionFormFields({
  values,
  onChange,
  idPrefix = "surf",
}: {
  values: StudioSessionFormValues;
  onChange: (patch: Partial<StudioSessionFormValues>) => void;
  idPrefix?: string;
}) {
  const toggleWaveType = (id: WaveTypeId) => {
    onChange({
      waveTypes: values.waveTypes.includes(id)
        ? values.waveTypes.filter((x) => x !== id)
        : [...values.waveTypes, id],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <CountryPicker
        id={`${idPrefix}-country`}
        label="Country"
        countryCode={values.countryCode}
        onCountryCodeChange={(code) => {
          onChange({ countryCode: code, regionId: null, spotId: null });
        }}
      />
      <RegionPicker
        id={`${idPrefix}-region`}
        countryCode={values.countryCode}
        regionId={values.regionId}
        onRegionIdChange={(id) => {
          onChange({ regionId: id, spotId: null });
        }}
      />
      <SpotPicker
        id={`${idPrefix}-spot`}
        regionId={values.regionId}
        spotId={values.spotId}
        onSpotIdChange={(spotId) => onChange({ spotId })}
      />

      <SessionDatePicker
        id={`${idPrefix}-session-date`}
        label="Session date"
        valueYmd={values.sessionDate}
        onChangeYmd={(sessionDate) => onChange({ sessionDate })}
      />

      <div>
        <label
          htmlFor={`${idPrefix}-session-time`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Session start time
        </label>
        <Input
          id={`${idPrefix}-session-time`}
          type="time"
          value={values.sessionTime}
          onChange={(e) => onChange({ sessionTime: e.target.value })}
          className="border-white/15 bg-white/5 text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-duration`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Duration ({formatDurationMinutes(values.durationMinutes)})
        </label>
        <Input
          id={`${idPrefix}-duration`}
          type="number"
          min={15}
          max={1440}
          step={15}
          value={values.durationMinutes}
          onChange={(e) =>
            onChange({ durationMinutes: parseInt(e.target.value, 10) || 0 })
          }
          className="border-white/15 bg-white/5 text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500">Minutes in the water (15–1440).</p>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-300">Conditions rating</span>
        <p className="text-xs text-zinc-500">
          Optional. How good were the overall conditions?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "border-white/15",
              values.conditionsRating === null
                ? "bg-[#26c2c9]/20 text-zinc-50"
                : "bg-transparent text-zinc-300",
            )}
            onClick={() => onChange({ conditionsRating: null })}
          >
            No rating
          </Button>
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "min-w-9 border-white/15",
                values.conditionsRating === n
                  ? "bg-[#26c2c9]/25 text-[#2dd4dc]"
                  : "bg-transparent text-zinc-300",
              )}
              onClick={() => onChange({ conditionsRating: n })}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-300">Wave types</legend>
        <p className="text-xs text-zinc-500">Select all that match. You can pick multiple.</p>
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          {WAVE_TYPE_OPTIONS.map((w) => {
            const checked = values.waveTypes.includes(w.id);
            return (
              <label
                key={w.id}
                className="flex cursor-pointer gap-3 rounded-md p-1 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleWaveType(w.id)}
                  className="mt-1 size-4 shrink-0 rounded border-white/30 bg-zinc-900 text-[#26c2c9] accent-[#26c2c9]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-100">{w.title}</span>
                  <span className="block text-xs text-zinc-500">{w.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export function validateStudioSessionFormValues(
  values: StudioSessionFormValues,
): string | null {
  if (!values.countryCode || !values.regionId || !values.spotId || !values.sessionDate) {
    return "Country, region, spot, and date are required.";
  }
  if (!values.sessionTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.sessionTime)) {
    return "Session time must be HH:mm (24-hour).";
  }
  if (
    !Number.isInteger(values.durationMinutes) ||
    values.durationMinutes < 15 ||
    values.durationMinutes > 1440
  ) {
    return "Duration must be between 15 and 1440 minutes.";
  }
  return null;
}
