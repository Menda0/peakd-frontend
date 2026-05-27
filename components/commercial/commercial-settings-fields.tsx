"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formInputClassName } from "@/lib/form-styles";
import type {
  CommercialSettings,
  VolumeDiscountTier,
} from "@/lib/commercial-settings";
import {
  currencyDecimals,
  majorToMinor,
  minorToMajor,
  normalizeCurrency,
  priceInputStep,
  SUPPORTED_CURRENCIES,
} from "@/lib/currencies";

export function CommercialSettingsFields({
  values,
  onChange,
  idPrefix = "commercial",
}: {
  values: CommercialSettings;
  onChange: (next: CommercialSettings) => void;
  idPrefix?: string;
}) {
  const updateTier = (index: number, patch: Partial<VolumeDiscountTier>) => {
    const tiers = values.volumeDiscounts.map((t, i) =>
      i === index ? { ...t, ...patch } : t,
    );
    onChange({ ...values, volumeDiscounts: tiers });
  };

  const removeTier = (index: number) => {
    onChange({
      ...values,
      volumeDiscounts: values.volumeDiscounts.filter((_, i) => i !== index),
    });
  };

  const addTier = () => {
    onChange({
      ...values,
      volumeDiscounts: [
        ...values.volumeDiscounts,
        { minVideos: 3, discountPercent: 10 },
      ],
    });
  };

  const handleCurrencyChange = (next: string) => {
    const normalized = normalizeCurrency(next);
    if (!normalized || normalized === values.currency) return;
    // Re-snap the integer price into the new currency's decimal grid so
    // the displayed major-unit value is preserved when the user toggles.
    const major = minorToMajor(values.videoPriceMinor, values.currency);
    onChange({
      ...values,
      currency: normalized,
      videoPriceMinor: Math.max(1, majorToMinor(major, normalized)),
    });
  };

  const decimals = currencyDecimals(values.currency);
  const major = minorToMajor(values.videoPriceMinor, values.currency).toFixed(
    decimals,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Currency"
          htmlFor={`${idPrefix}-currency`}
          description="Stripe charges buyers in this currency (auto-converted for foreign buyers)."
        >
          <Select
            value={values.currency}
            onValueChange={(v) => handleCurrencyChange(v ?? values.currency)}
          >
            <SelectTrigger
              id={`${idPrefix}-currency`}
              className={formInputClassName}
            >
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label={`Price per wave (${values.currency})`}
          htmlFor={`${idPrefix}-price`}
          description="Surfers pay this much to buy and unlock a wave."
        >
          <Input
            id={`${idPrefix}-price`}
            type="number"
            min={0}
            step={priceInputStep(values.currency)}
            inputMode="decimal"
            className={formInputClassName}
            value={major}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value);
              if (!Number.isFinite(n) || n <= 0) {
                onChange({ ...values, videoPriceMinor: 1 });
                return;
              }
              onChange({
                ...values,
                videoPriceMinor: Math.max(1, majorToMinor(n, values.currency)),
              });
            }}
          />
        </FormField>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Volume discounts</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Applied when buying multiple waves in one purchase (buy &amp; claim).
        </p>
        <div className="flex flex-col gap-2">
          {values.volumeDiscounts.map((tier, index) => (
            <div
              key={`${tier.minVideos}-${index}`}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-white/[0.02] p-3"
            >
              <FormField label="Min. waves" className="w-24">
                <Input
                  type="number"
                  min={2}
                  className={formInputClassName}
                  value={tier.minVideos}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    updateTier(index, {
                      minVideos: Number.isFinite(n) && n >= 2 ? n : 2,
                    });
                  }}
                />
              </FormField>
              <FormField label="Discount %" className="w-24">
                <Input
                  type="number"
                  min={0}
                  max={90}
                  className={formInputClassName}
                  value={tier.discountPercent}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    updateTier(index, {
                      discountPercent:
                        Number.isFinite(n) && n >= 0 ? Math.min(90, n) : 0,
                    });
                  }}
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-red-300"
                aria-label="Remove tier"
                onClick={() => removeTier(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 border-border text-foreground"
          onClick={addTier}
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="ml-1.5">Add discount tier</span>
        </Button>
      </div>
    </div>
  );
}
