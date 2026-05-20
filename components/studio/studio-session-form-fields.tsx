"use client";

import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { SpotPicker } from "@/components/pickers/spot-picker";
import { SessionDatePicker } from "@/components/studio/session-date-picker";
import { Button } from "@/components/ui/button";
import { CommercialSettingsFields } from "@/components/commercial/commercial-settings-fields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { formInputClassName, formLabelClassName } from "@/lib/form-styles";
import {
  WAVE_TYPE_OPTIONS,
  formatDurationMinutes,
  type WaveTypeId,
} from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";
import {
  formatDiscountSummary,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import {
  defaultUndisclosedGeoForCountry,
  isUndisclosedRegionId,
} from "@/lib/geo-undisclosed";

export type StudioSessionFormValues = {
  countryCode: string | null;
  regionId: string | null;
  spotId: string | null;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: WaveTypeId[];
  isCommercial?: boolean;
  customizeCommercialPricing?: boolean;
  commercialSettings?: CommercialSettings | null;
};

export function StudioSessionFormFields({
  values,
  onChange,
  idPrefix = "surf",
  includeUndisclosedOption = true,
  showCommercialFields = false,
  showCommercialToggle = true,
  partnerCommercialDefaults = null,
}: {
  values: StudioSessionFormValues;
  onChange: (patch: Partial<StudioSessionFormValues>) => void;
  idPrefix?: string;
  /** Default “Undisclosed” region/spot for sessions that should not share location. */
  includeUndisclosedOption?: boolean;
  showCommercialFields?: boolean;
  /** When false, commercial is chosen earlier (e.g. new-session modal step). */
  showCommercialToggle?: boolean;
  partnerCommercialDefaults?: CommercialSettings | null;
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
          if (!code) {
            onChange({ countryCode: null, regionId: null, spotId: null });
            return;
          }
          const undisclosed = includeUndisclosedOption
            ? defaultUndisclosedGeoForCountry(code)
            : { regionId: null, spotId: null };
          onChange({
            countryCode: code,
            regionId: undisclosed.regionId,
            spotId: undisclosed.spotId,
          });
        }}
      />
      <RegionPicker
        id={`${idPrefix}-region`}
        countryCode={values.countryCode}
        regionId={values.regionId}
        includeUndisclosedOption={includeUndisclosedOption}
        onRegionIdChange={(id) => {
          if (!id) {
            onChange({ regionId: null, spotId: null });
            return;
          }
          const spotId =
            includeUndisclosedOption &&
            values.countryCode &&
            isUndisclosedRegionId(id, values.countryCode)
              ? defaultUndisclosedGeoForCountry(values.countryCode).spotId
              : null;
          onChange({ regionId: id, spotId });
        }}
      />
      <SpotPicker
        id={`${idPrefix}-spot`}
        countryCode={values.countryCode}
        regionId={values.regionId}
        spotId={values.spotId}
        includeUndisclosedOption={includeUndisclosedOption}
        onSpotIdChange={(spotId) => onChange({ spotId })}
      />

      <SessionDatePicker
        id={`${idPrefix}-session-date`}
        label="Session date"
        valueYmd={values.sessionDate}
        onChangeYmd={(sessionDate) => onChange({ sessionDate })}
      />

      <FormField label="Session start time" htmlFor={`${idPrefix}-session-time`}>
        <Input
          id={`${idPrefix}-session-time`}
          type="time"
          value={values.sessionTime}
          onChange={(e) => onChange({ sessionTime: e.target.value })}
          className={formInputClassName}
        />
      </FormField>

      <FormField
        label={`Duration (${formatDurationMinutes(values.durationMinutes)})`}
        htmlFor={`${idPrefix}-duration`}
        description="Minutes in the water (15–1440)."
      >
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
          className={formInputClassName}
        />
      </FormField>

      <Field>
        <FieldLabel className={formLabelClassName}>Conditions rating</FieldLabel>
        <FieldDescription className="text-zinc-500">
          Optional. How good were the overall conditions?
        </FieldDescription>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "border-white/15",
              values.conditionsRating === null
                ? "bg-primary/20 text-zinc-50"
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
                  ? "bg-primary/25 text-primary"
                  : "bg-transparent text-zinc-300",
              )}
              onClick={() => onChange({ conditionsRating: n })}
            >
              {n}
            </Button>
          ))}
        </div>
      </Field>

      <FieldSet>
        <FieldLegend variant="label" className={formLabelClassName}>
          Wave types
        </FieldLegend>
        <FieldDescription className="text-zinc-500">
          Select all that match. You can pick multiple.
        </FieldDescription>
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          {WAVE_TYPE_OPTIONS.map((w) => {
            const checked = values.waveTypes.includes(w.id);
            const checkboxId = `${idPrefix}-wave-${w.id}`;
            return (
              <Field
                key={w.id}
                orientation="horizontal"
                className="cursor-pointer rounded-md p-1 hover:bg-white/5"
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={() => toggleWaveType(w.id)}
                />
                <div className="min-w-0">
                  <FieldLabel htmlFor={checkboxId} className="text-sm text-zinc-100">
                    {w.title}
                  </FieldLabel>
                  <FieldDescription className="text-xs text-zinc-500">
                    {w.description}
                  </FieldDescription>
                </div>
              </Field>
            );
          })}
        </div>
      </FieldSet>

      {showCommercialFields ? (
        <FieldSet className="gap-3">
          <FieldLegend className="text-sm font-medium text-zinc-200">
            {showCommercialToggle ? "Commercial session" : "Commercial pricing"}
          </FieldLegend>
          <FieldDescription className="text-zinc-500">
            On the discover feed, waves show snapshot images only. Surfers can claim for free or
            pay Peaks to unlock video playback.
          </FieldDescription>
          {showCommercialToggle ? (
            <Field orientation="horizontal" className="items-center gap-2">
              <Checkbox
                id={`${idPrefix}-commercial`}
                checked={values.isCommercial === true}
                onCheckedChange={(checked) =>
                  onChange({
                    isCommercial: checked === true,
                    customizeCommercialPricing:
                      checked === true ? values.customizeCommercialPricing : false,
                  })
                }
              />
              <FieldLabel htmlFor={`${idPrefix}-commercial`} className="text-sm text-zinc-100">
                Mark as commercial
              </FieldLabel>
            </Field>
          ) : null}
          {values.isCommercial ? (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
              {partnerCommercialDefaults && !values.customizeCommercialPricing ? (
                <p className="text-xs text-zinc-400">
                  Using partner defaults: {formatDiscountSummary(partnerCommercialDefaults)}
                </p>
              ) : null}
              {!partnerCommercialDefaults && !values.customizeCommercialPricing ? (
                <p className="text-xs text-amber-400/90">
                  Set commercial pricing on your partner profile first, or customize below.
                </p>
              ) : null}
              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-commercial-custom`}
                  checked={values.customizeCommercialPricing === true}
                  onCheckedChange={(checked) =>
                    onChange({
                      customizeCommercialPricing: checked === true,
                      commercialSettings:
                        checked === true
                          ? values.commercialSettings ?? partnerCommercialDefaults
                          : null,
                    })
                  }
                />
                <FieldLabel
                  htmlFor={`${idPrefix}-commercial-custom`}
                  className="text-sm text-zinc-100"
                >
                  Customize pricing for this session
                </FieldLabel>
              </Field>
              {values.customizeCommercialPricing && values.commercialSettings ? (
                <CommercialSettingsFields
                  idPrefix={`${idPrefix}-commercial`}
                  values={values.commercialSettings}
                  onChange={(commercialSettings) => onChange({ commercialSettings })}
                />
              ) : null}
            </div>
          ) : null}
        </FieldSet>
      ) : null}
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
