"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { formInputClassName } from "@/lib/form-styles";
import type { CommercialSettings, VolumeDiscountTier } from "@/lib/commercial-settings";
import { Plus, Trash2 } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Price per wave (Peaks)"
        htmlFor={`${idPrefix}-price`}
        description="Surfers pay this many Peaks to buy and unlock a wave."
      >
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min={1}
          step={1}
          className={formInputClassName}
          value={values.videoPricePeaks}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            onChange({
              ...values,
              videoPricePeaks: Number.isFinite(n) && n >= 1 ? n : 1,
            });
          }}
        />
      </FormField>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Volume discounts</p>
        <p className="mb-3 text-xs text-zinc-500">
          Applied when buying multiple waves in one purchase (buy &amp; claim).
        </p>
        <div className="flex flex-col gap-2">
          {values.volumeDiscounts.map((tier, index) => (
            <div
              key={`${tier.minVideos}-${index}`}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3"
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
                className="shrink-0 text-zinc-400 hover:text-red-300"
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
          className="mt-2 border-white/15 text-zinc-200"
          onClick={addTier}
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="ml-1.5">Add discount tier</span>
        </Button>
      </div>
    </div>
  );
}
