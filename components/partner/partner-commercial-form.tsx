"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formInputClassName } from "@/lib/form-styles";
import {
  commercialFormToSettings,
  commercialSettingsToFormValues,
  partnerCommercialFormSchema,
  type PartnerCommercialFormValues,
} from "@/lib/partner-profile-schemas";
import type { CommercialSettings } from "@/lib/commercial-settings";
import { cn } from "@/lib/utils";

export function PartnerCommercialForm({
  savedSettings,
  showSuggestedDefaultsHint = false,
  saving,
  onSave,
}: {
  /** Persisted settings from the API; null means show suggested defaults only. */
  savedSettings: CommercialSettings | null;
  showSuggestedDefaultsHint?: boolean;
  saving: boolean;
  onSave: (settings: CommercialSettings) => Promise<void>;
}) {
  const form = useForm<PartnerCommercialFormValues>({
    resolver: zodResolver(partnerCommercialFormSchema),
    defaultValues: commercialSettingsToFormValues(savedSettings),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "volumeDiscounts",
  });

  useEffect(() => {
    form.reset(commercialSettingsToFormValues(savedSettings));
  }, [savedSettings, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await onSave(commercialFormToSettings(values));
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
        {showSuggestedDefaultsHint ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/90">
            Suggested starting values are shown below. Adjust them if you like, then save when
            you are ready to run commercial sessions — or leave this tab until later.
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="videoPricePeaks"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-200">Price per wave (Peaks)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 50"
                  className={cn(formInputClassName, "max-w-xs")}
                />
              </FormControl>
              <FormDescription className="text-zinc-500">
                Surfers pay this many Peaks to buy and unlock a wave.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">Volume discounts</p>
          <p className="mb-3 text-xs text-zinc-500">
            Applied when buying multiple waves in one purchase (buy &amp; claim). Leave a row
            empty to remove it on save.
          </p>
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3"
              >
                <FormField
                  control={form.control}
                  name={`volumeDiscounts.${index}.minVideos`}
                  render={({ field: f }) => (
                    <FormItem className="w-28">
                      <FormLabel className="text-xs text-zinc-400">Min. waves</FormLabel>
                      <FormControl>
                        <Input
                          {...f}
                          type="text"
                          inputMode="numeric"
                          placeholder="3"
                          className={formInputClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`volumeDiscounts.${index}.discountPercent`}
                  render={({ field: f }) => (
                    <FormItem className="w-28">
                      <FormLabel className="text-xs text-zinc-400">Discount %</FormLabel>
                      <FormControl>
                        <Input
                          {...f}
                          type="text"
                          inputMode="numeric"
                          placeholder="10"
                          className={formInputClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 shrink-0 text-zinc-400 hover:text-red-300"
                  aria-label="Remove tier"
                  onClick={() => remove(index)}
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
            onClick={() => append({ minVideos: "", discountPercent: "" })}
          >
            <Plus className="size-3.5" aria-hidden />
            <span className="ml-1.5">Add discount tier</span>
          </Button>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-4">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save commercial settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
