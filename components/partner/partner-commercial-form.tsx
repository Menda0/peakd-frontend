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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formInputClassName } from "@/lib/form-styles";
import {
  commercialFormToSettings,
  commercialSettingsToFormValues,
  partnerCommercialFormSchema,
  SUPPORTED_PRICING_CURRENCIES,
  type PartnerCommercialFormValues,
} from "@/lib/partner-profile-schemas";
import type { CommercialSettings } from "@/lib/commercial-settings";
import {
  formatMoney,
  majorToMinor,
  priceInputStep,
} from "@/lib/currencies";
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

  const liveCurrency = form.watch("currency");
  const livePrice = form.watch("videoPriceMajor");
  const liveMinor = (() => {
    const trimmed = (livePrice ?? "").trim().replace(",", ".");
    const major = Number.parseFloat(trimmed);
    if (!Number.isFinite(major) || major <= 0) return null;
    return Math.max(1, majorToMinor(major, liveCurrency || "EUR"));
  })();

  return (
    <Form {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
        {showSuggestedDefaultsHint ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/90">
            Suggested starting values are shown below. Adjust them if you like, then save when
            you are ready to run commercial sessions — or leave this tab until later.
          </p>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Currency</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? field.value)}
                  >
                    <SelectTrigger className={formInputClassName}>
                      <SelectValue placeholder="Pick a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_PRICING_CURRENCIES.map((cur) => (
                        <SelectItem key={cur} value={cur}>
                          {cur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription className="text-muted-foreground">
                  Buyers are charged and you settle in this currency. Stripe
                  auto-converts the displayed price for buyers in other regions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="videoPriceMajor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  Price per wave ({liveCurrency || "EUR"})
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step={priceInputStep(liveCurrency || "EUR")}
                    min={0}
                    inputMode="decimal"
                    placeholder="e.g. 5.00"
                    className={cn(formInputClassName)}
                  />
                </FormControl>
                <FormDescription className="text-muted-foreground">
                  You earn this amount per wave.{" "}
                  {liveMinor != null ? (
                    <span className="text-foreground">
                      Stripe charges buyers{" "}
                      {formatMoney(liveMinor, liveCurrency || "EUR")} (plus a
                      20% platform commission added on top).
                    </span>
                  ) : null}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-foreground">Volume discounts</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Applied when buying multiple waves in one purchase (buy &amp; claim). Leave a row
            empty to remove it on save.
          </p>
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-border bg-white/[0.02] p-3"
              >
                <FormField
                  control={form.control}
                  name={`volumeDiscounts.${index}.minVideos`}
                  render={({ field: f }) => (
                    <FormItem className="w-28">
                      <FormLabel className="text-xs text-muted-foreground">Min. waves</FormLabel>
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
                      <FormLabel className="text-xs text-muted-foreground">Discount %</FormLabel>
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
                  className="mt-6 shrink-0 text-muted-foreground hover:text-red-300"
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
            className="mt-2 border-border text-foreground"
            onClick={() => append({ minVideos: "", discountPercent: "" })}
          >
            <Plus className="size-3.5" aria-hidden />
            <span className="ml-1.5">Add discount tier</span>
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
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
