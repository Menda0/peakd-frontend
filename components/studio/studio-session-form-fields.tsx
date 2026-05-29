"use client";

import { ConditionsRatingPicker } from "@/components/conditions/conditions-rating-picker";
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
import { formatDurationMinutes, type WaveTypeId } from "@/lib/surf-session-waves";
import { WaveTypeCheckboxGrid } from "@/components/studio/wave-type-checkbox-grid";
import { cn } from "@/lib/utils";
import {
  formatDiscountSummary,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import {
  defaultUndisclosedGeoForCountry,
  isUndisclosedRegionId,
} from "@/lib/geo-undisclosed";
import { validateWizardRegionDateStep } from "@/lib/studio-session-validation";

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

export function StudioSessionRegionDateFields({
  values,
  onChange,
  idPrefix = "surf",
  includeUndisclosedOption = true,
}: {
  values: StudioSessionFormValues;
  onChange: (patch: Partial<StudioSessionFormValues>) => void;
  idPrefix?: string;
  includeUndisclosedOption?: boolean;
}) {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      <SessionDatePicker
        id={`${idPrefix}-session-date`}
        label="Session date"
        valueYmd={values.sessionDate}
        onChangeYmd={(sessionDate) => onChange({ sessionDate })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Session start" htmlFor={`${idPrefix}-session-time`}>
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
          description="Minutes (15–1440)."
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
      </div>
    </div>
  );
}

export function StudioSessionConditionsFields({
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
      <Field>
        <FieldLabel className={formLabelClassName}>Conditions</FieldLabel>
        <FieldDescription className="text-muted-foreground">
          Optional. Surfline scale for overall session conditions.
        </FieldDescription>
        <ConditionsRatingPicker
          value={values.conditionsRating}
          onChange={(conditionsRating) => onChange({ conditionsRating })}
        />
      </Field>

      <FieldSet>
        <FieldLegend variant="label" className={formLabelClassName}>
          Wave types
        </FieldLegend>
        <FieldDescription className="text-muted-foreground">
          Select all that match. You can pick multiple.
        </FieldDescription>
        <WaveTypeCheckboxGrid
          idPrefix={`${idPrefix}-wave`}
          selected={values.waveTypes}
          onToggle={toggleWaveType}
        />
      </FieldSet>
    </div>
  );
}

export function StudioSessionCommercialPricingFields({
  values,
  onChange,
  idPrefix = "surf",
  partnerCommercialDefaults = null,
}: {
  values: StudioSessionFormValues;
  onChange: (patch: Partial<StudioSessionFormValues>) => void;
  idPrefix?: string;
  partnerCommercialDefaults?: CommercialSettings | null;
}) {
  return (
    <FieldSet className="gap-3">
      <FieldDescription className="text-muted-foreground">
        On the discover feed, waves show snapshot images only. Surfers can claim for free or pay
        to unlock video playback in your chosen currency.
      </FieldDescription>
      <div className="space-y-3 rounded-lg border border-border bg-white/[0.02] p-3">
        {partnerCommercialDefaults && !values.customizeCommercialPricing ? (
          <p className="text-xs text-muted-foreground">
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
            className="text-sm text-foreground"
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
    </FieldSet>
  );
}

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
  return (
    <div className="flex flex-col gap-5">
      <StudioSessionRegionDateFields
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
        includeUndisclosedOption={includeUndisclosedOption}
      />
      <StudioSessionConditionsFields
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
      />
      {showCommercialFields ? (
        <FieldSet className="gap-3">
          <FieldLegend className="text-sm font-medium text-foreground">
            {showCommercialToggle ? "Commercial session" : "Commercial pricing"}
          </FieldLegend>
          <FieldDescription className="text-muted-foreground">
            On the discover feed, waves show snapshot images only. Surfers can claim for free or
            pay to unlock video playback in your chosen currency.
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
              <FieldLabel htmlFor={`${idPrefix}-commercial`} className="text-sm text-foreground">
                Mark as commercial
              </FieldLabel>
            </Field>
          ) : null}
          {values.isCommercial ? (
            <StudioSessionCommercialPricingFields
              values={values}
              onChange={onChange}
              idPrefix={idPrefix}
              partnerCommercialDefaults={partnerCommercialDefaults}
            />
          ) : null}
        </FieldSet>
      ) : null}
    </div>
  );
}

export function validateStudioSessionFormValues(
  values: StudioSessionFormValues,
): string | null {
  return validateWizardRegionDateStep(values);
}
